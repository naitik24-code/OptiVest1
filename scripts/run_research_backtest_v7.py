import os
import sys
import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
import warnings
import time
import json
import subprocess
import shap
import cvxpy as cp
from scipy import stats
from scipy.optimize import minimize
import sklearn
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
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

def print_problem_definition(name, prob, mu_source, tau, solver, eps):
    print(f"\n--- Arm: {name} ---")
    print(f"Mu Source: {mu_source} | Tau: {tau} | Solver: {solver} (eps={eps})")
    print(f"Objective: {prob.objective}")
    for i, c in enumerate(prob.constraints):
        print(f"Constraint {i}: {c}")

def get_optimizer_weights(mu, cov_mat, prev_w, n, tau, asset_cap, use_tc, eps, turnover_cap, print_def=False, name=""):
    w = cp.Variable(n)
    tc_penalty = 0.0010 * cp.norm(w - prev_w, 1) if use_tc else 0
    objective = cp.Maximize(mu.T @ w - tau * cp.quad_form(w, cov_mat) - tc_penalty)
    constraints = [cp.sum(w) == 1, w >= 0]
    if asset_cap: constraints.append(w <= 0.20)
    if turnover_cap is not None: constraints.append(cp.norm(w - prev_w, 1) <= turnover_cap)
        
    prob = cp.Problem(objective, constraints)
    
    if print_def:
        mu_src = "ML Predict" if np.max(np.abs(mu)) < 0.1 else "Historical"
        if np.max(np.abs(mu)) == 0: mu_src = "Zero"
        print_problem_definition(name, prob, mu_src, tau, "SCS", eps)
        
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
    print("Running Walk-Forward ML Backtest (V7)...")
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
            
    all_results = pd.concat(results, axis=0).reset_index(drop=True)
    return all_results

def run_portfolio_optimization(predictions, prices):
    print("\nRunning Master 10-Arm Suite, Controls, Sweeps, and Sensitivities...")
    pred_pivot = predictions.pivot(index='date', columns='asset', values='pred_xgb')
    actual_pivot = predictions.pivot(index='date', columns='asset', values='target')
    dates = pred_pivot.index
    
    master_arms = ['EW', 'Buy-and-hold', 'MV_20cap', 'MV_nocap', 'MV_capped_15', 'MV-ML_20cap', 'MV-ML_nocap', 'APDE_full', 'APDE_soft_20cap', 'APDE_soft_nocap']
    control_arms = ['APDE_mu_zero', 'APDE_mu_trailing'] + [f'APDE_mu_shuffled_{s}' for s in range(5)]
    eps_sweeps = ['MV-ML_nocap_eps4', 'MV-ML_nocap_eps6', 'MV-ML_nocap_eps8', 'APDE_soft_nocap_eps4', 'APDE_soft_nocap_eps6', 'APDE_soft_nocap_eps8']
    cap_sweeps = [f'APDE_cap_{c}' for c in [0.05, 0.10, 0.15, 0.25, 0.50, 'None']]
    
    all_arms = master_arms + control_arms + eps_sweeps + cap_sweeps
    
    portfolio_returns = {s: [] for s in all_arms}
    portfolio_turnover = {s: [] for s in all_arms}
    prev_w = {s: None for s in all_arms}
    cap_binds = {s: 0 for s in all_arms}
    
    printed_defs = False
    
    for t_idx, t in enumerate(dates):
        assets = pred_pivot.loc[t].dropna().index
        if len(assets) < 5: continue
            
        mu_ml = pred_pivot.loc[t, assets].values
        real_ret = actual_pivot.loc[t, assets].values
        
        hist_prices = prices.loc[:t, assets].iloc[-252:]
        cov_mat = hist_prices.pct_change().cov().values * 21
        mu_hist = hist_prices.pct_change().mean().values * 21
        
        n = len(assets)
        for s in all_arms:
            if prev_w[s] is None: prev_w[s] = np.ones(n)/n
            
        prev_real_ret = actual_pivot.loc[dates[t_idx-1], assets].fillna(0).values if t_idx > 0 else None

        # EW & B&H
        wd = calc_drift(prev_w['EW'], prev_real_ret)
        w = np.ones(n)/n
        to = np.sum(np.abs(w - wd))
        portfolio_returns['EW'].append(np.dot(w, real_ret) - 0.0010 * to)
        portfolio_turnover['EW'].append(to)
        prev_w['EW'] = w
        
        wd_bh = calc_drift(prev_w['Buy-and-hold'], prev_real_ret)
        to_bh = 0 # No rebalancing!
        portfolio_returns['Buy-and-hold'].append(np.dot(wd_bh, real_ret)) # no cost
        portfolio_turnover['Buy-and-hold'].append(0)
        prev_w['Buy-and-hold'] = wd_bh

        def run_arm(name, mu, asset_cap, use_tc, turnover_cap, eps=1e-7, print_def=False):
            wd = calc_drift(prev_w[name], prev_real_ret)
            w_raw = get_optimizer_weights(mu, cov_mat, wd, n, 3.0, asset_cap, use_tc, eps, turnover_cap, print_def, name)
            w = clean_weights(w_raw) if asset_cap else w_raw 
            to = np.sum(np.abs(w - wd))
            portfolio_returns[name].append(np.dot(w, real_ret) - 0.0010 * to)
            portfolio_turnover[name].append(to)
            prev_w[name] = w
            if turnover_cap is not None and to >= turnover_cap - 0.001:
                cap_binds[name] += 1

        # Master Suite
        p = not printed_defs
        run_arm('MV_20cap', mu_hist, True, False, None, print_def=p)
        run_arm('MV_nocap', mu_hist, False, False, None, print_def=p)
        run_arm('MV_capped_15', mu_hist, True, False, 0.15, print_def=p)
        run_arm('MV-ML_20cap', mu_ml, True, False, None, print_def=p)
        run_arm('MV-ML_nocap', mu_ml, False, False, None, print_def=p)
        run_arm('APDE_full', mu_ml, True, True, 0.15, print_def=p)
        run_arm('APDE_soft_20cap', mu_ml, True, True, None, print_def=p)
        run_arm('APDE_soft_nocap', mu_ml, False, True, None, print_def=p)
        
        # Controls
        run_arm('APDE_mu_zero', np.zeros(n), True, True, 0.15, print_def=p)
        run_arm('APDE_mu_trailing', mu_hist, True, True, 0.15, print_def=p)
        for s_idx in range(5):
            np.random.seed(s_idx + int(time.time()*1e6) % 1000) # Pseudo-random per period
            mu_shuf = np.random.permutation(mu_ml)
            run_arm(f'APDE_mu_shuffled_{s_idx}', mu_shuf, True, True, 0.15)
            
        # EPS Sensitivity
        run_arm('MV-ML_nocap_eps4', mu_ml, False, False, None, eps=1e-4)
        run_arm('MV-ML_nocap_eps6', mu_ml, False, False, None, eps=1e-6)
        run_arm('MV-ML_nocap_eps8', mu_ml, False, False, None, eps=1e-8)
        run_arm('APDE_soft_nocap_eps4', mu_ml, False, True, None, eps=1e-4)
        run_arm('APDE_soft_nocap_eps6', mu_ml, False, True, None, eps=1e-6)
        run_arm('APDE_soft_nocap_eps8', mu_ml, False, True, None, eps=1e-8)
        
        # Cap Sweep
        for cap_val in [0.05, 0.10, 0.15, 0.25, 0.50, None]:
            run_arm(f'APDE_cap_{cap_val}', mu_ml, True, True, cap_val)
            
        printed_defs = True

    def calc_metrics(rets, turnovers, name):
        if len(rets) == 0: return {}
        ra = np.array(rets)
        ar = np.mean(ra)*12
        cagr = (np.prod(1+ra)**(12/len(ra)) - 1) if len(ra)>0 else 0
        av = np.std(ra)*np.sqrt(12)
        sh = ar/av if av>0 else 0
        dr = np.minimum(ra, 0)
        sort = ar / (np.sqrt(np.mean(dr**2))*np.sqrt(12)) if np.sqrt(np.mean(dr**2))>0 else 0
        cum = (1+ra).cumprod()
        pk = np.maximum.accumulate(cum)
        mdd = np.max((pk-cum)/pk)
        ato = np.mean(turnovers)*12
        res = {'Strategy': name, 'CAGR': round(cagr*100,2), 'Sharpe': round(sh,2), 'Sortino': round(sort,2), 'Ann_Vol': round(av*100,2), 'Max_DD': round(mdd*100,2), 'Ann_TO': round(ato*100,2)}
        return res
        
    def generate_df(arm_list):
        summary = []
        for s in arm_list: 
            m = calc_metrics(portfolio_returns[s], portfolio_turnover[s], s)
            ci_ew = block_bootstrap_diff_ci(portfolio_returns[s], portfolio_returns['EW'])
            ci_mv = block_bootstrap_diff_ci(portfolio_returns[s], portfolio_returns['MV_20cap'])
            m['CI_vs_EW'] = f"[{ci_ew[0]:.2f}, {ci_ew[1]:.2f}]"
            m['CI_vs_MV_20cap'] = f"[{ci_mv[0]:.2f}, {ci_mv[1]:.2f}]"
            m['Binds'] = cap_binds[s]
            summary.append(m)
        return pd.DataFrame(summary)

    master_df = generate_df(master_arms)
    
    # Average the shuffled runs
    shuf_rets = np.mean([portfolio_returns[f'APDE_mu_shuffled_{i}'] for i in range(5)], axis=0)
    shuf_to = np.mean([portfolio_turnover[f'APDE_mu_shuffled_{i}'] for i in range(5)], axis=0)
    shuf_metrics = calc_metrics(shuf_rets, shuf_to, "APDE_mu_shuffled_AVG")
    
    controls_df = generate_df(['APDE_mu_zero', 'APDE_mu_trailing'])
    controls_df = pd.concat([controls_df, pd.DataFrame([shuf_metrics])], ignore_index=True)
    
    eps_df = generate_df(eps_sweeps)
    sweep_df = generate_df(cap_sweeps)

    return master_df, controls_df, eps_df, sweep_df

def export_forecast_metrics(predictions):
    """Export claim-audit metrics from the actual walk-forward predictions."""
    y = predictions['target'].to_numpy()
    p = predictions['pred_xgb'].to_numpy()
    errors = y - p
    date_ics = predictions.groupby('date').apply(
        lambda d: stats.spearmanr(d['target'], d['pred_xgb']).statistic
        if len(d) >= 3 else np.nan
    ).dropna()
    loss_by_date = predictions.assign(loss_model=errors ** 2, loss_zero=y ** 2).groupby('date')[['loss_model', 'loss_zero']].mean()
    diff = loss_by_date['loss_model'] - loss_by_date['loss_zero']
    dm_stat = float(diff.mean() / (diff.std(ddof=1) / np.sqrt(len(diff)))) if len(diff) > 1 and diff.std(ddof=1) > 0 else np.nan
    out = pd.DataFrame([{
        'n_observations': len(predictions),
        'n_dates': predictions['date'].nunique(),
        'rmse': float(np.sqrt(np.mean(errors ** 2))),
        'mae': float(np.mean(np.abs(errors))),
        'directional_accuracy': float(np.mean(np.sign(y) == np.sign(p))),
        'rank_ic_mean': float(date_ics.mean()),
        'rank_ic_t_stat': float(date_ics.mean() / (date_ics.std(ddof=1) / np.sqrt(len(date_ics)))) if len(date_ics) > 1 and date_ics.std(ddof=1) > 0 else np.nan,
        'out_of_sample_r2_vs_zero': float(1 - np.sum(errors ** 2) / np.sum(y ** 2)),
        'diebold_mariano_stat_vs_zero': dm_stat,
        'diebold_mariano_dates': len(diff)
    }])
    out.to_csv('results_v7/Forecast_Metrics.csv', index=False)
    predictions.to_csv('results_v7/WalkForward_Predictions.csv', index=False)
    return out

def slsqp_vs_scs_objective_check():
    print("\nRunning SLSQP vs SCS Objective Benchmark...")
    sizes = [50, 100]
    latencies = []
    np.random.seed(42)
    for N in sizes:
        loadings = np.random.randn(N, 5)
        idio = np.diag(np.random.rand(N) * 0.05)
        cov = loadings @ np.cov(np.random.randn(252, 5).T) @ loadings.T + idio
        cov = cov * 21 / 252
        mu = np.random.randn(N) * 0.01
        prev_w = np.ones(N)/N
        
        # SCS
        w_cp = cp.Variable(N)
        prob = cp.Problem(cp.Maximize(mu.T @ w_cp - 3.0 * cp.quad_form(w_cp, cov) - 0.0010 * cp.norm(w_cp - prev_w, 1)), [cp.sum(w_cp) == 1, w_cp >= 0, w_cp <= 0.20, cp.norm(w_cp - prev_w, 1) <= 0.15])
        prob.solve(solver=cp.SCS, eps=1e-7)
        scs_obj = prob.value
        w_scs = w_cp.value
        scs_viol = max(max(0, np.sum(w_scs)-1.0001), max(0, -np.min(w_scs)), max(0, np.max(w_scs)-0.2001), max(0, np.sum(np.abs(w_scs - prev_w))-0.1501))
        
        # SLSQP
        def obj(w): return -(mu.T @ w - 3.0 * (w.T @ cov @ w) - 0.0010 * np.sum(np.abs(w - prev_w)))
        def jac(w): return -(mu - 6.0 * cov @ w - 0.0010 * np.sign(w - prev_w))
        cons = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1, 'jac': lambda w: np.ones(N)},
                {'type': 'ineq', 'fun': lambda w: 0.15 - np.sum(np.abs(w - prev_w)), 'jac': lambda w: -np.sign(w - prev_w)})
        bounds = [(0, 0.20) for _ in range(N)]
        res = minimize(obj, prev_w, method='SLSQP', bounds=bounds, constraints=cons, jac=jac, options={'ftol': 1e-7})
        slsqp_obj = -res.fun
        w_sl = res.x
        sl_viol = max(max(0, np.sum(w_sl)-1.0001), max(0, -np.min(w_sl)), max(0, np.max(w_sl)-0.2001), max(0, np.sum(np.abs(w_sl - prev_w))-0.1501))
        
        latencies.append({'N': N, 'SCS_Obj': scs_obj, 'SLSQP_Obj': slsqp_obj, 'SCS_Max_Viol': scs_viol, 'SLSQP_Max_Viol': sl_viol})
    
    return pd.DataFrame(latencies)

def dump_metadata():
    try: 
        git_commit = subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode('ascii').strip()
        subprocess.check_call(['git', 'tag', '-f', 'v7-freeze', git_commit])
    except: git_commit = "NOT FOUND"
    meta = {
        "cvxpy": cp.__version__, "scikit_learn": sklearn.__version__, "shap": shap.__version__, "scs": "Unknown (Cvxpy integrated)",
        "git_commit_hash": git_commit, "canonical_script": "run_research_backtest_v7.py"
    }
    with open('results_v7/metadata.json', 'w') as f: json.dump(meta, f, indent=4)

if __name__ == "__main__":
    os.makedirs('results_v7', exist_ok=True)
    prices, vix = fetch_data(n_assets=50, years=10)
    dataset, prices = engineer_features(prices, vix)
    
    predictions = run_ml_backtest(dataset)
    export_forecast_metrics(predictions)
    master_df, controls_df, eps_df, sweep_df = run_portfolio_optimization(predictions, prices)
    
    print("\n--- Master 10-Arm Suite (V7) ---")
    print(master_df.to_string())
    print("\n--- Forecasting Controls (V7) ---")
    print(controls_df.to_string())
    print("\n--- Solver EPS Sensitivity (V7) ---")
    print(eps_df.to_string())
    print("\n--- Full APDE Cap Sweep (V7) ---")
    print(sweep_df.to_string())
    
    slsqp_df = slsqp_vs_scs_objective_check()
    print("\n--- SLSQP vs SCS Objective Comparison ---")
    print(slsqp_df.to_string())
    
    dump_metadata()
    master_df.to_csv('results_v7/Table_Master_10Arm.csv', index=False)
    controls_df.to_csv('results_v7/Controls.csv', index=False)
    eps_df.to_csv('results_v7/EPS_Sensitivity.csv', index=False)
    sweep_df.to_csv('results_v7/Cap_Sweep.csv', index=False)
    slsqp_df.to_csv('results_v7/Solver_Benchmark.csv', index=False)
    print("\nBacktest V7 complete. Artifacts saved in 'results_v7/'.")
