import os
import sys
import pytest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.apde_engine import APDEEngine

def test_decision_score_mathematical_correctness():
    # Setup test case
    r_hat = 0.05
    # single asset case but formulated as vectors
    w = np.array([0.2, 0.8])
    w0 = np.array([0.1, 0.9])
    Sigma_h = np.array([[0.04, 0.01], [0.01, 0.04]])
    
    tau = 1.0
    gamma = 0.0010
    
    # Target index 0 (the asset changing from 0.1 to 0.2)
    res = APDEEngine.calculate_decision_score(r_hat, Sigma_h, w, w0, tau, gamma, target_index=0)
    
    # Expected calculations:
    # forecast = 0.05
    # marginal_risk = (Sigma_h @ w)[0] = 0.04*0.2 + 0.01*0.8 = 0.008 + 0.008 = 0.016
    # risk_term = -2 * 1.0 * 0.016 = -0.032
    # w_change = 0.2 - 0.1 = 0.1 > 0 -> sgn = 1
    # cost_term = -0.0010 * 1 = -0.0010
    # ds_i = 0.05 - 0.032 - 0.0010 = 0.017
    
    tol = 1e-6 # I. Explicit numerical tolerance
    
    # B, C, D
    assert abs(res["forecast_term"] - 0.05) < tol
    assert abs(res["risk_term"] - (-0.032)) < tol
    assert abs(res["cost_term"] - (-0.0010)) < tol
    # A
    assert abs(res["decision_score"] - 0.017) < tol

def test_decision_score_signs():
    # Setup same but w0 > w (negative allocation change)
    r_hat = 0.05
    w = np.array([0.1, 0.9])
    w0 = np.array([0.2, 0.8])
    Sigma_h = np.array([[0.04, 0.01], [0.01, 0.04]])
    
    tau = 1.0
    gamma = 0.0010
    
    # E. Positive allocation change (checked in previous test)
    # F. Negative allocation change
    res_neg = APDEEngine.calculate_decision_score(r_hat, Sigma_h, w, w0, tau, gamma, target_index=0)
    # w_change = 0.1 - 0.2 = -0.1 < 0 -> sgn = -1
    # cost_term = -0.0010 * -1 = 0.0010
    assert abs(res_neg["cost_term"] - 0.0010) < 1e-6
    
    # G. No allocation change
    w_same = np.array([0.1, 0.9])
    res_same = APDEEngine.calculate_decision_score(r_hat, Sigma_h, w_same, w_same, tau, gamma, target_index=0)
    # sgn = 0 -> cost_term = 0
    assert abs(res_same["cost_term"] - 0.0) < 1e-6

def test_decision_score_multiple_assets():
    # H. Multiple assets return correct scores
    r_hat = np.array([0.05, 0.06])
    w = np.array([0.2, 0.8])
    w0 = np.array([0.1, 0.9])
    Sigma_h = np.array([[0.04, 0.01], [0.01, 0.04]])
    tau = 1.0
    gamma = 0.0010
    
    res_0 = APDEEngine.calculate_decision_score(r_hat[0], Sigma_h, w, w0, tau, gamma, 0)
    res_1 = APDEEngine.calculate_decision_score(r_hat[1], Sigma_h, w, w0, tau, gamma, 1)
    
    assert res_0["decision_score"] is not None
    assert res_1["decision_score"] is not None
    assert res_0["decision_score"] != res_1["decision_score"]

if __name__ == "__main__":
    pytest.main(["-v", __file__])
