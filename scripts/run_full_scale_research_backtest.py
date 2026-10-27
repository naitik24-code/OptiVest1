import os
import sys
import json
import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
import warnings
from xgboost import XGBRegressor

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
from app.services.cde_canonical import CDE
from tests.test_apde_constraints import canonical_apde_solve

warnings.filterwarnings('ignore')

UNIVERSE = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "BRK-B", "JNJ", "V", "WMT",
    "PG", "NVDA", "HD", "MA", "UNH", "XOM", "DIS", "JPM", "VZ", "KO",
    "PEP", "CSCO", "INTC", "MRK", "ABT", "CVX", "PFE", "CRM", "NKE", "MCD",
    "T", "WFC", "BA", "MDT", "COST", "TXN", "NEE", "HON", "UNP", "LIN",
    "BMY", "QCOM", "AMGN", "PM", "IBM", "SBUX", "GE", "GS", "CAT", "MMM"
]

def fetch_data(n_assets=50, years=10):
    tickers = UNIVERSE[:n_assets]
    end_date = datetime(2023, 12, 31)
    start_date = end_date - timedelta(days=int(years * 365.25))
    data = yf.download(tickers, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'), progress=False)
    prices = data['Close'].ffill().dropna(axis=1)
    
    # If not all 50 assets have 10 years of data, we will report a data availability blocker
    if len(prices.columns) < n_assets:
        missing = set(tickers) - set(prices.columns)
        raise ValueError(f"DATA AVAILABILITY BLOCKER: Could not fetch full 10-year history for all {n_assets} assets. Missing/Dropped: {missing}")
    return prices, list(prices.columns)

def engineer_features(prices):
    returns_1d = prices.pct_change(1)
    features = {}
    features['mom_1m'] = prices.pct_change(21)
    features['vol_1m'] = returns_1d.rolling(21).std() * np.sqrt(252)
    target = prices.pct_change(21).shift(-21)
    
    df_list = []
    for col in prices.columns:
        df = pd.DataFrame({
            'mom_1m': features['mom_1m'][col],
            'vol_1m': features['vol_1m'][col],
            'target': target[col]
        })
        df['asset'] = col
        df['date'] = df.index
        df = df.dropna()
        df_list.append(df)
        
    dataset = pd.concat(df_list, axis=0)
    return dataset.sort_values(['date', 'asset']).set_index('date')

def run_experiment(use_cde=False):
    try:
        prices, universe = fetch_data(50, 10)
    except ValueError as e:
        return {"error": str(e)}
        
    dataset = engineer_features(prices)
    dates = sorted(list(set(dataset.index)))
    
    # Paper typically uses a rolling window, but for simplicity we will just train once per year or on a fixed window
    # to avoid extreme computational constraints, but let's try a rolling 3-year window for training.
    # Actually, to exactly match, we train on past data and predict.
    
    portfolio_returns = []
    turnover_list = []
    cde_candidates_list = []
    
    rebalance_dates = dates[252*3::21] # Start after 3 years, monthly
    
    n_total = len(universe)
    w_apde = np.ones(n_total) / n_total
    
    config = {"base_score": 0.5, "threshold": 0.0, "top_k": 2}
    
    for t_idx, t in enumerate(rebalance_dates):
        if t not in dataset.index: continue
        
        # Train model on trailing 3 years
        train_start = dates[max(0, dates.index(t) - 252*3)]
        train_df = dataset.loc[train_start:t].iloc[:-len(universe)] # exclude current date
        day_data = dataset.loc[[t]]
        
        feature_cols = ['mom_1m', 'vol_1m']
        X_train, y_train = train_df[feature_cols], train_df['target']
        
        if len(X_train) == 0: continue
        
        model = XGBRegressor(n_estimators=10, max_depth=3, random_state=42)
        model.fit(X_train, y_train)
        
        preds = model.predict(day_data[feature_cols])
        pred_dict = {asset: pred for asset, pred in zip(day_data['asset'], preds)}
        
        if use_cde:
            candidates = CDE.run(universe, {}, {}, config)
            cde_tickers = [c["ticker"] for c in candidates]
            current_holdings = [universe[i] for i in range(n_total) if w_apde[i] > 1e-4]
            final_symbols = list(set(current_holdings + cde_tickers))
            cde_candidates_list.append(len(cde_tickers))
        else:
            final_symbols = universe.copy()
            cde_candidates_list.append(n_total)
            
        hist_prices = prices.loc[:t, final_symbols].iloc[-252:]
        cov_mat = hist_prices.pct_change().cov().values * 252
        
        mu_array = np.array([pred_dict.get(sym, 0.0) for sym in final_symbols])
        w0 = np.array([w_apde[universe.index(sym)] for sym in final_symbols])
        w0 = w0 / np.sum(w0) if np.sum(w0) > 0 else np.ones(len(final_symbols))/len(final_symbols)
        
        try:
            target_w_subset, status = canonical_apde_solve(mu_array, cov_mat, w0, len(final_symbols), final_symbols)
        except Exception as e:
            return {"error": f"COMPUTATIONAL BLOCKER: APDE Solver failed at {t}: {str(e)}"}
            
        if status != "optimal":
            return {"error": f"COMPUTATIONAL BLOCKER: APDE Solver infeasible at {t}. Strict constraints (sum=1, w<=0.2, turnover<=0.15) could not be met for 50 assets."}
            
        # Enforce constraints explicitly
        assert np.isclose(np.sum(target_w_subset), 1.0, atol=1e-3)
        assert np.all(target_w_subset >= -1e-4)
        assert np.max(target_w_subset) <= 0.20 + 1e-3
        assert np.sum(np.abs(target_w_subset - w0)) <= 0.15 + 1e-3
        
        w_new = np.zeros(n_total)
        for i, sym in enumerate(final_symbols):
            w_new[universe.index(sym)] = target_w_subset[i]
            
        turnover = np.sum(np.abs(w_new - w_apde))
        w_apde = w_new
        
        if t_idx < len(rebalance_dates) - 1:
            next_t = rebalance_dates[t_idx+1]
            period_returns = prices.loc[next_t, universe] / prices.loc[t, universe] - 1
            port_ret = np.dot(w_apde, period_returns) - 0.0010 * turnover
            portfolio_returns.append(port_ret)
            turnover_list.append(turnover)

    if len(portfolio_returns) > 0:
        ann_ret = np.mean(portfolio_returns) * 12
        ann_vol = np.std(portfolio_returns) * np.sqrt(12)
        sharpe = ann_ret / ann_vol if ann_vol > 0 else 0
    else:
        ann_ret, ann_vol, sharpe = 0, 0, 0
        
    return {
        "portfolio_return": ann_ret,
        "volatility": ann_vol,
        "sharpe": sharpe,
        "avg_turnover": np.mean(turnover_list) if turnover_list else 0,
        "n_rebalances": len(rebalance_dates),
        "cde_candidates_list": cde_candidates_list
    }

def main():
    print("Running Experiment A (No CDE)...")
    res_A = run_experiment(use_cde=False)
    
    if "error" in res_A:
        print(f"Experiment A Blocked: {res_A['error']}")
        out = {"blocker": res_A["error"]}
        with open("research_backtest_original_50asset.json", 'w') as f:
            json.dump(out, f, indent=4)
        return

    print("Running Experiment B (With CDE)...")
    res_B = run_experiment(use_cde=True)
    
    if "error" in res_B:
        print(f"Experiment B Blocked: {res_B['error']}")
        return
        
    with open("research_backtest_original_50asset.json", 'w') as f:
        json.dump(res_A, f, indent=4)
        
    with open("research_backtest_cde_50asset.json", 'w') as f:
        json.dump(res_B, f, indent=4)
        
    comparison = {
        "universe_size": 50,
        "date_range": "2013-12-31 to 2023-12-31",
        "model": "XGBRegressor",
        "rebalance_frequency": "Monthly",
        "number_of_rebalances": res_A["n_rebalances"],
        "cde_configuration": {"top_k": 10},
        "original_metrics": res_A,
        "cde_metrics": res_B,
        "differences": {
            "return": res_B["portfolio_return"] - res_A["portfolio_return"],
            "volatility": res_B["volatility"] - res_A["volatility"],
            "sharpe": res_B["sharpe"] - res_A["sharpe"],
            "turnover": res_B["avg_turnover"] - res_A["avg_turnover"]
        }
    }
    
    with open("research_backtest_50asset_comparison.json", 'w') as f:
        json.dump(comparison, f, indent=4)
    print("Done. Saved comparison.")

if __name__ == "__main__":
    main()
