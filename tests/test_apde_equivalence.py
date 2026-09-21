import os
import sys
import numpy as np
import pandas as pd
import pytest

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../scripts')))

from backend.app.services.apde_service import APDEService
from scripts.run_research_backtest_v7 import fetch_data, engineer_features, run_ml_backtest, get_optimizer_weights, calc_drift, clean_weights

def test_apde_weight_equivalence():
    """
    Verifies that the production APDEService matches the research backtest's APDE_full
    arm to within 1e-6 maximum weight difference across all 78 backtest dates.
    """
    prices, vix = fetch_data(n_assets=50, years=10)
    dataset, prices = engineer_features(prices, vix)
    
    predictions = run_ml_backtest(dataset)
    
    pred_pivot = predictions.pivot(index='date', columns='asset', values='pred_xgb')
    actual_pivot = predictions.pivot(index='date', columns='asset', values='target')
    dates = pred_pivot.index
    
    prev_w_research = None
    prev_w_prod = None
    
    max_diffs = []
    
    for t_idx, t in enumerate(dates):
        assets = pred_pivot.loc[t].dropna().index
        if len(assets) < 5: continue
            
        mu_ml = pred_pivot.loc[t, assets].values
        
        hist_prices = prices.loc[:t, assets].iloc[-252:]
        cov_mat = hist_prices.pct_change().cov().values * 21
        
        n = len(assets)
        if prev_w_research is None: 
            prev_w_research = np.ones(n)/n
            prev_w_prod = np.ones(n)/n
            
        prev_real_ret = actual_pivot.loc[dates[t_idx-1], assets].fillna(0).values if t_idx > 0 else None
        
        wd_research = calc_drift(prev_w_research, prev_real_ret)
        wd_prod = calc_drift(prev_w_prod, prev_real_ret)
        
        # Research formulation (APDE_full: mu_ml, True, True, 0.15)
        w_raw = get_optimizer_weights(mu_ml, cov_mat, wd_research, n, 3.0, True, True, 1e-7, 0.15, False, "APDE_full")
        w_research = clean_weights(w_raw)
        
        # Production formulation
        w_prod = APDEService.optimize_portfolio(
            mu=mu_ml, cov_mat=cov_mat, prev_w=wd_prod, 
            tau=3.0, asset_cap=True, use_tc=True, turnover_cap=0.15, eps=1e-7
        )
        
        diff = np.max(np.abs(w_research - w_prod))
        max_diffs.append(diff)
        
        prev_w_research = w_research
        prev_w_prod = w_prod
        
    assert len(max_diffs) == 78, f"Expected 78 dates, got {len(max_diffs)}"
    overall_max_diff = max(max_diffs)
    print(f"Overall Max Weight Diff across 78 dates: {overall_max_diff}")
    assert overall_max_diff < 1e-6, f"Weight difference {overall_max_diff} exceeded 1e-6 tolerance!"
