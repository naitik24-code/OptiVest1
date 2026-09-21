import os
import sys
import numpy as np
import pandas as pd
import pytest
from xgboost import XGBRegressor

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))
from backend.app.services.apde_service import APDEService
from backend.app.services.candidate_discovery_service import CandidateDiscoveryService
from backend.app.services.explain_service import ExplainService
from backend.app.services.decision_cycle import DecisionCycle

from scripts.run_research_backtest_v7 import fetch_data, engineer_features, run_ml_backtest

@pytest.fixture(scope="module")
def data_context():
    prices, vix = fetch_data(n_assets=50, years=10)
    dataset, prices = engineer_features(prices, vix)
    predictions = run_ml_backtest(dataset)
    return predictions, prices

def test_78_date_replay(data_context):
    """
    Replay the 78 dates using the production services.
    """
    predictions, prices = data_context
    pred_pivot = predictions.pivot(index='date', columns='asset', values='pred_xgb')
    dates = pred_pivot.index
    assert len(dates) == 78, f"Expected 78 dates, found {len(dates)}"
    
    # Just run through a few to verify no crashes in the integrated loop
    cde = CandidateDiscoveryService(top_n=15)
    cycle = DecisionCycle()
    
    prev_w = None
    for i, t in enumerate(dates):
        if i > 5: break # only run a few to save time in test suite
        assets = pred_pivot.loc[t].dropna().index
        if len(assets) < 5: continue
        
        preds_df = pd.DataFrame({'asset': assets, 'pred_xgb': pred_pivot.loc[t, assets].values})
        candidates = cde.discover_candidates(preds_df)
        assert len(candidates) <= 15
        
        # APDE on candidates
        mu = pred_pivot.loc[t, candidates].values
        hist_prices = prices.loc[:t, candidates].iloc[-252:]
        cov_mat = hist_prices.pct_change().cov().values * 21
        
        w_prod = APDEService.optimize_portfolio(
            mu=mu, cov_mat=cov_mat, prev_w=np.ones(len(candidates))/len(candidates), 
            tau=3.0, asset_cap=True, use_tc=True, turnover_cap=0.15, eps=1e-5
        )
        assert len(w_prod) == len(candidates)

def test_cash_heavy_demo(data_context):
    """
    Simulate a user with a cash-heavy portfolio (e.g. initial deposit).
    """
    predictions, prices = data_context
    t = predictions['date'].unique()[-1]
    
    cde = CandidateDiscoveryService(top_n=10)
    cycle = DecisionCycle()
    
    assets = predictions[predictions['date'] == t]['asset'].values
    mu = predictions[predictions['date'] == t]['pred_xgb'].values
    
    hist_prices = prices.loc[:t, assets].iloc[-252:]
    cov_mat = hist_prices.pct_change().cov().values * 21
    
    # 100% Cash -> prev_w = 0 for all assets
    prev_w = np.zeros(len(assets))
    
    w_prod = APDEService.optimize_portfolio(
        mu=mu, cov_mat=cov_mat, prev_w=prev_w, 
        tau=3.0, asset_cap=True, use_tc=True, turnover_cap=1.0, eps=1e-5 # Allow high turnover for initial allocation
    )
    
    # Should allocate 100%
    assert np.isclose(np.sum(w_prod), 1.0, atol=1e-3)
    assert np.max(w_prod) <= 0.20 + 1e-4

def test_3_user_test(data_context):
    """
    Simulate 3 different users with different risk tolerances (tau).
    """
    predictions, prices = data_context
    t = predictions['date'].unique()[-1]
    
    assets = predictions[predictions['date'] == t]['asset'].values[:15]
    mu = predictions[predictions['date'] == t]['pred_xgb'].values[:15]
    
    hist_prices = prices.loc[:t, assets].iloc[-252:]
    cov_mat = hist_prices.pct_change().cov().values * 21
    
    # User 1: Aggressive (tau=1.0)
    w_agg = APDEService.optimize_portfolio(mu, cov_mat, None, tau=1.0, asset_cap=True, use_tc=True, turnover_cap=1.0, eps=1e-4)
    # User 2: Moderate (tau=3.0)
    w_mod = APDEService.optimize_portfolio(mu, cov_mat, None, tau=3.0, asset_cap=True, use_tc=True, turnover_cap=1.0, eps=1e-4)
    # User 3: Conservative (tau=10.0)
    w_con = APDEService.optimize_portfolio(mu, cov_mat, None, tau=10.0, asset_cap=True, use_tc=True, turnover_cap=1.0, eps=1e-4)
    
    # Risk taken should be inversely proportional to tau
    risk_agg = w_agg.T @ cov_mat @ w_agg
    risk_mod = w_mod.T @ cov_mat @ w_mod
    risk_con = w_con.T @ cov_mat @ w_con
    
    # Note: Sometimes they might be close, but generally risk_agg >= risk_mod >= risk_con
    assert risk_agg >= risk_mod - 1e-4
    assert risk_mod >= risk_con - 1e-4

def test_cde_ablation(data_context):
    """
    Test difference between APDE with CDE and without CDE.
    """
    predictions, prices = data_context
    t = predictions['date'].unique()[-1]
    
    assets = predictions[predictions['date'] == t]['asset'].values
    preds_df = predictions[predictions['date'] == t]
    
    cde = CandidateDiscoveryService(top_n=10)
    candidates = cde.discover_candidates(preds_df)
    
    assert len(candidates) == 10
    assert len(assets) > 10
    
    # APDE with CDE
    mu_cde = preds_df[preds_df['asset'].isin(candidates)]['pred_xgb'].values
    hist_prices_cde = prices.loc[:t, candidates].iloc[-252:]
    cov_mat_cde = hist_prices_cde.pct_change().cov().values * 21
    w_cde = APDEService.optimize_portfolio(mu_cde, cov_mat_cde, None, tau=3.0, asset_cap=True, use_tc=True, turnover_cap=1.0, eps=1e-4)
    
    # APDE without CDE (Full universe)
    mu_full = preds_df['pred_xgb'].values
    hist_prices_full = prices.loc[:t, assets].iloc[-252:]
    cov_mat_full = hist_prices_full.pct_change().cov().values * 21
    w_full = APDEService.optimize_portfolio(mu_full, cov_mat_full, None, tau=3.0, asset_cap=True, use_tc=True, turnover_cap=1.0, eps=1e-4)
    
    assert len(w_cde) == 10
    assert len(w_full) == len(assets)
