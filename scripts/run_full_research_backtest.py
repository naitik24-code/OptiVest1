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

def fetch_data(n_assets=15, years=2):
    tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "NVDA", "JPM", "V", "WMT", "JNJ", "PG", "HD", "MA", "UNH"][:n_assets]
    end_date = datetime(2023, 12, 31)
    start_date = end_date - timedelta(days=int(years * 365.25))
    data = yf.download(tickers, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'), progress=False)
    prices = data['Close'].ffill().dropna(axis=1)
    return prices, tickers

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

def run_experiment(deterministic_run_id=1):
    prices, universe = fetch_data()
    dataset = engineer_features(prices)
    
    dates = sorted(list(set(dataset.index)))
    # Train on first half, test on second half
    split_idx = len(dates) // 2
    train_dates = dates[:split_idx]
    test_dates = dates[split_idx:]
    
    train_df = dataset.loc[train_dates]
    test_df = dataset.loc[test_dates]
    
    feature_cols = ['mom_1m', 'vol_1m']
    X_train, y_train = train_df[feature_cols], train_df['target']
    
    model = XGBRegressor(n_estimators=10, max_depth=3, random_state=42)
    model.fit(X_train, y_train)
    
    # Portfolio Backtest
    n_total = len(universe)
    w_apde = np.ones(n_total) / n_total
    
    portfolio_returns = []
    turnover_list = []
    
    rebalance_dates = test_dates[::21] # Monthly rebalance
    
    config = {"base_score": 0.5, "threshold": 0.0, "top_k": 5}
    
    for t_idx, t in enumerate(rebalance_dates):
        if t not in dataset.index: continue
        day_data = dataset.loc[[t]]
        
        preds = model.predict(day_data[feature_cols])
        pred_dict = {asset: pred for asset, pred in zip(day_data['asset'], preds)}
        
        # 1. Run CDE
        candidates = CDE.run(universe, {}, {}, config)
        cde_tickers = [c["ticker"] for c in candidates]
        
        # Determine actual available assets
        current_holdings = [universe[i] for i in range(n_total) if w_apde[i] > 1e-4]
        final_symbols = list(set(current_holdings + cde_tickers))
        
        # 2. Form APDE inputs
        hist_prices = prices.loc[:t, final_symbols].iloc[-252:]
        cov_mat = hist_prices.pct_change().cov().values * 252
        
        # Forecasts
        mu_array = np.array([pred_dict.get(sym, 0.0) for sym in final_symbols])
        
        w0 = np.array([w_apde[universe.index(sym)] for sym in final_symbols])
        w0 = w0 / np.sum(w0) if np.sum(w0) > 0 else np.ones(len(final_symbols))/len(final_symbols)
        
        # 3. Canonical APDE Optimize
        target_w_subset, status = canonical_apde_solve(mu_array, cov_mat, w0, len(final_symbols), final_symbols)
        
        # 4. Enforce constraints explicitly with asserts
        assert np.isclose(np.sum(target_w_subset), 1.0, atol=1e-3), "Sum constraint violated"
        assert np.all(target_w_subset >= -1e-4), "Long-only constraint violated"
        assert np.max(target_w_subset) <= 0.20 + 1e-3, "Asset cap constraint violated"
        assert np.sum(np.abs(target_w_subset - w0)) <= 0.15 + 1e-3, "Turnover constraint violated"
        
        # Reconstruct full w array
        w_new = np.zeros(n_total)
        for i, sym in enumerate(final_symbols):
            w_new[universe.index(sym)] = target_w_subset[i]
            
        turnover = np.sum(np.abs(w_new - w_apde))
        w_apde = w_new
        
        # Compute return for next month
        if t_idx < len(rebalance_dates) - 1:
            next_t = rebalance_dates[t_idx+1]
            period_returns = prices.loc[next_t, universe] / prices.loc[t, universe] - 1
            port_ret = np.dot(w_apde, period_returns) - 0.0010 * turnover
            portfolio_returns.append(port_ret)
            turnover_list.append(turnover)

    # Metrics
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
        "n_rebalances": len(rebalance_dates)
    }

def main():
    print("Running Run 1...")
    res1 = run_experiment(1)
    print("Running Run 2...")
    res2 = run_experiment(2)
    
    # Save results
    out = {
        "experiment_configuration": "Canonical Phase 5 Research Backtest (Subset)",
        "universe_size": 15,
        "date_range": "2021-12-31 to 2023-12-31",
        "data_source": "yfinance",
        "model": "XGBRegressor",
        "cde_configuration": {"top_k": 5},
        "apde_configuration": {"solver": "SCS", "constraints": "sum=1, w>=0, max_w=0.20, L1<=0.15"},
        "rebalance_frequency": "Monthly",
        "transaction_cost_assumptions": 0.0010,
        "number_of_rebalances": res1["n_rebalances"],
        "portfolio_metrics_run1": res1,
        "portfolio_metrics_run2": res2,
        "deterministic_repeat": res1 == res2,
        "paper_vs_current_implementation": {
            "Expected APDE Volatility": {
                "paper": "0.10",
                "current": res1["volatility"],
                "difference": abs(res1["volatility"] - 0.10),
                "explanation": "Current implementation runs on 2022-2023 subset, paper ran 2013-2023."
            }
        }
    }
    
    out_path = os.path.join(os.path.dirname(__file__), "research_backtest_reproducibility.json")
    with open(out_path, 'w') as f:
        json.dump(out, f, indent=4)
    print("Done. Saved to", out_path)

if __name__ == "__main__":
    main()
