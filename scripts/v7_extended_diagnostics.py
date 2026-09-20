import os
import sys
import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
import warnings
import time
import json
import shap
import cvxpy as cp
from scipy import stats
from xgboost import XGBRegressor

warnings.filterwarnings('ignore')

def fetch_data(n_assets=50, years=10):
    tickers = [
        "AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "BRK-B", "JNJ", "V", "WMT",
        "PG", "NVDA", "HD", "MA", "UNH", "XOM", "DIS", "JPM", "VZ", "KO",
        "PEP", "CSCO", "INTC", "MRK", "ABT", "CVX", "PFE", "CRM", "NKE", "MCD",
        "T", "WFC", "BA", "MDT", "COST", "TXN", "NEE", "HON", "UNP", "LIN",
        "BMY", "QCOM", "AMGN", "PM", "IBM", "SBUX", "GE", "GS", "CAT", "MMM"
    ][:n_assets]
    end_date = datetime(2023, 12, 31)
    start_date = end_date - timedelta(days=int(years * 365.25) + 300)
    cache_file = "market_data_cache.pkl"
    if os.path.exists(cache_file):
        data = pd.read_pickle(cache_file)
        if len(data.columns.levels[1] if isinstance(data.columns, pd.MultiIndex) else []) < n_assets:
             data = yf.download(tickers, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'), progress=False)
             data.to_pickle(cache_file)
    else:
        data = yf.download(tickers, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'), progress=False)
        data.to_pickle(cache_file)
    prices = data['Close'].ffill()
    prices = prices.dropna(axis=1, thresh=int(len(prices)*0.9)).bfill()
    vix = yf.download('^VIX', start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'), progress=False)['Close']
    return prices, vix

def engineer_features(prices, vix):
    returns_1d = prices.pct_change(1)
    features = {}
    features['mom_1m'] = prices.pct_change(21)
    features['mom_2m'] = prices.pct_change(42)
    features['mom_3m'] = prices.pct_change(63)
    features['vol_1m'] = returns_1d.rolling(21).std() * np.sqrt(252)
    target = prices.pct_change(21).shift(-21)
    df_list = []
    for col in prices.columns:
        df = pd.DataFrame({
            'mom_1m': features['mom_1m'][col],
            'mom_2m': features['mom_2m'][col],
            'mom_3m': features['mom_3m'][col],
            'vol_1m': features['vol_1m'][col],
            'target': target[col]
        })
        df['vix'] = vix.reindex(df.index).ffill()
        df['asset'] = col
        df['date'] = df.index
        df = df.dropna()
        df_list.append(df)
    dataset = pd.concat(df_list, axis=0)
    dataset = dataset.sort_values(['date', 'asset']).set_index('date')
    return dataset, prices

def calc_drift(w, prev_period_returns):
    if prev_period_returns is None: return w
    w_drift = w * (1 + prev_period_returns)
    s = np.sum(w_drift)
    return w_drift / s if s > 0 else w

def clean_weights(w):
    w = np.clip(w, 0.0, 0.20)
    s = np.sum(w)
    return w / s if s > 0 else np.ones(len(w))/len(w)

def get_optimizer_weights(mu, cov_mat, prev_w, n, tau, asset_cap, use_tc, eps, turnover_cap):
    w = cp.Variable(n)
    tc_penalty = 0.0010 * cp.norm(w - prev_w, 1) if use_tc else 0
    objective = cp.Maximize(mu.T @ w - tau * cp.quad_form(w, cov_mat) - tc_penalty)
    constraints = [cp.sum(w) == 1, w >= 0]
    if asset_cap: constraints.append(w <= 0.20)
    if turnover_cap is not None: constraints.append(cp.norm(w - prev_w, 1) <= turnover_cap)
    prob = cp.Problem(objective, constraints)
    try:
        prob.solve(solver=cp.SCS, eps=eps)
        w_val = w.value
        return w_val if w_val is not None else prev_w
    except:
        return prev_w

def block_bootstrap_diff_ci(rets1, rets2, block_size=6, iterations=1000, seed=42):
    np.random.seed(seed)
    n = min(len(rets1), len(rets2))
    n_blocks = n // block_size
    if n_blocks == 0: return 0, 0
    boot_diffs = []
    for _ in range(iterations):
        indices = np.random.choice(n_blocks, n_blocks, replace=True)
        boot_rets1, boot_rets2 = [], []
        for idx in indices:
            boot_rets1.extend(rets1[idx*block_size : (idx+1)*block_size])
            boot_rets2.extend(rets2[idx*block_size : (idx+1)*block_size])
        s1 = (np.mean(boot_rets1) * 12) / (np.std(boot_rets1) * np.sqrt(12) + 1e-9)
        s2 = (np.mean(boot_rets2) * 12) / (np.std(boot_rets2) * np.sqrt(12) + 1e-9)
        boot_diffs.append(s1 - s2)
    return np.percentile(boot_diffs, 2.5), np.percentile(boot_diffs, 97.5)

def run_ml_backtest(dataset):
    unique_dates = dataset.index.unique()
    start_idx = np.searchsorted(unique_dates, unique_dates[0] + pd.Timedelta(days=365*4))
    test_dates = unique_dates[start_idx::21]
    xgb = XGBRegressor(n_estimators=50, max_depth=3, learning_rate=0.1, random_state=42)
    results = []
    feature_cols = ['mom_1m', 'mom_2m', 'mom_3m', 'vol_1m', 'vix']
    for t_date in test_dates:
        train_end = t_date - pd.Timedelta(days=21)
        train_start = train_end - pd.Timedelta(days=365*4)
        train_data = dataset[(dataset.index >= train_start) & (dataset.index <= train_end)]
        test_data = dataset[dataset.index == t_date]
        if len(train_data) < 1000 or len(test_data) == 0: continue
        X_train, y_train = train_data[feature_cols], train_data['target']
        X_test, y_test = test_data[feature_cols], test_data['target']
        p_low, p_high = np.percentile(y_train, [1, 99])
        y_train = np.clip(y_train, p_low, p_high)
        xgb.fit(X_train, y_train)
        pred_xgb = xgb.predict(X_test)
        res = test_data[['asset', 'target']].copy()
        res['pred_xgb'] = pred_xgb
        res['date'] = t_date
        results.append(res)
    return pd.concat(results, axis=0).reset_index(drop=True)

def run_diagnostics(predictions, prices):
    print("Running Extended Diagnostics...")
    pred_pivot = predictions.pivot(index='date', columns='asset', values='pred_xgb')
    actual_pivot = predictions.pivot(index='date', columns='asset', values='target')
    dates = pred_pivot.index
    
    arms = ['APDE_full', 'APDE_mu_zero', 'MV_capped_15', 'MV_20cap', 'APDE_soft_20cap']
    arms += [f'APDE_mu_shuffled_{i}' for i in range(5)]
    
    returns = {s: [] for s in arms}
    prev_w = {s: None for s in arms}
    
    eff_n = {'APDE_full': [], 'APDE_mu_zero': [], 'APDE_mu_shuffled_AVG': []}
    wt_vol = {'APDE_full': [], 'APDE_mu_zero': [], 'APDE_mu_shuffled_AVG': []}
    
    for t_idx, t in enumerate(dates):
        assets = pred_pivot.loc[t].dropna().index
        if len(assets) < 5: continue
        mu_ml = pred_pivot.loc[t, assets].values
        real_ret = actual_pivot.loc[t, assets].values
        hist_prices = prices.loc[:t, assets].iloc[-252:]
        cov_mat = hist_prices.pct_change().cov().values * 21
        mu_hist = hist_prices.pct_change().mean().values * 21
        trailing_vol = np.sqrt(np.diag(cov_mat)) # Volatility of each asset
        n = len(assets)
        for s in arms:
            if prev_w[s] is None: prev_w[s] = np.ones(n)/n
        prev_real_ret = actual_pivot.loc[dates[t_idx-1], assets].fillna(0).values if t_idx > 0 else None

        def run_arm(name, mu, asset_cap, use_tc, turnover_cap):
            wd = calc_drift(prev_w[name], prev_real_ret)
            w_raw = get_optimizer_weights(mu, cov_mat, wd, n, 3.0, asset_cap, use_tc, 1e-7, turnover_cap)
            w = clean_weights(w_raw) if asset_cap else w_raw 
            to = np.sum(np.abs(w - wd))
            returns[name].append(np.dot(w, real_ret) - 0.0010 * to)
            prev_w[name] = w
            return w
            
        w_full = run_arm('APDE_full', mu_ml, True, True, 0.15)
        w_zero = run_arm('APDE_mu_zero', np.zeros(n), True, True, 0.15)
        run_arm('MV_capped_15', mu_hist, True, False, 0.15)
        run_arm('MV_20cap', mu_hist, True, False, None)
        run_arm('APDE_soft_20cap', mu_ml, True, True, None)
        
        shuf_w_list = []
        for i in range(5):
            np.random.seed(i + int(time.time()*1e6) % 1000)
            mu_shuf = np.random.permutation(mu_ml)
            shuf_w_list.append(run_arm(f'APDE_mu_shuffled_{i}', mu_shuf, True, True, 0.15))
            
        # Characteristic logging
        eff_n['APDE_full'].append(1.0 / np.sum(w_full**2))
        wt_vol['APDE_full'].append(np.dot(w_full, trailing_vol))
        eff_n['APDE_mu_zero'].append(1.0 / np.sum(w_zero**2))
        wt_vol['APDE_mu_zero'].append(np.dot(w_zero, trailing_vol))
        
        w_shuf_avg = np.mean(shuf_w_list, axis=0)
        eff_n['APDE_mu_shuffled_AVG'].append(1.0 / np.sum(w_shuf_avg**2))
        wt_vol['APDE_mu_shuffled_AVG'].append(np.dot(w_shuf_avg, trailing_vol))

    shuf_rets = np.mean([returns[f'APDE_mu_shuffled_{i}'] for i in range(5)], axis=0)
    
    # Calculate CIs
    ci_zero = block_bootstrap_diff_ci(returns['APDE_full'], returns['APDE_mu_zero'])
    ci_shuf = block_bootstrap_diff_ci(returns['APDE_full'], shuf_rets)
    ci_mvc = block_bootstrap_diff_ci(returns['APDE_full'], returns['MV_capped_15'])
    ci_mv = block_bootstrap_diff_ci(returns['APDE_full'], returns['MV_20cap'])
    ci_soft = block_bootstrap_diff_ci(returns['APDE_full'], returns['APDE_soft_20cap'])
    
    cis = {
        'vs_APDE_mu_zero': f"[{ci_zero[0]:.2f}, {ci_zero[1]:.2f}]",
        'vs_APDE_mu_shuffled_AVG': f"[{ci_shuf[0]:.2f}, {ci_shuf[1]:.2f}]",
        'vs_MV_capped_15': f"[{ci_mvc[0]:.2f}, {ci_mvc[1]:.2f}]",
        'vs_MV_20cap': f"[{ci_mv[0]:.2f}, {ci_mv[1]:.2f}]",
        'vs_APDE_soft_20cap': f"[{ci_soft[0]:.2f}, {ci_soft[1]:.2f}]"
    }
    pd.DataFrame([cis]).to_csv('results_v7/extended_bootstraps.csv', index=False)
    
    def get_sharpe(rets):
        ra = np.array(rets)
        return (np.mean(ra)*12) / (np.std(ra)*np.sqrt(12) + 1e-9)
        
    shuf_sharpes = [get_sharpe(returns[f'APDE_mu_shuffled_{i}']) for i in range(5)]
    shuf_stats = {
        'Mean_Sharpe': np.mean(shuf_sharpes),
        'SD_Sharpe': np.std(shuf_sharpes),
        'Min_Sharpe': np.min(shuf_sharpes),
        'Max_Sharpe': np.max(shuf_sharpes)
    }
    pd.DataFrame([shuf_stats]).to_csv('results_v7/shuffled_sharpe_stats.csv', index=False)
    
    chars = []
    for s in ['APDE_full', 'APDE_mu_zero', 'APDE_mu_shuffled_AVG']:
        chars.append({
            'Arm': s,
            'Effective_N': np.mean(eff_n[s]),
            'Weighted_Trailing_Vol': np.mean(wt_vol[s])
        })
    pd.DataFrame(chars).to_csv('results_v7/portfolio_characteristics.csv', index=False)
    
    print("Diagnostics complete.")

if __name__ == "__main__":
    prices, vix = fetch_data()
    dataset, prices = engineer_features(prices, vix)
    predictions = run_ml_backtest(dataset)
    run_diagnostics(predictions, prices)
