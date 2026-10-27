import pytest
import numpy as np
import cvxpy as cp

def canonical_apde_solve(mu_array, cov_matrix, current_w, n_assets, symbols):
    tau = 1.0 # arbitrary risk lambda / 2
    gamma = 0.0010

    max_asset_weight = 0.20
    max_turnover = 0.15

    w = cp.Variable(n_assets)
    r_hat = mu_array
    Sigma_h = cov_matrix
    w0 = current_w

    expected_return = r_hat @ w
    risk = cp.quad_form(w, Sigma_h)
    turnover = cp.norm(w - w0, 1)

    objective = cp.Maximize(expected_return - tau * risk - gamma * turnover)

    constraints = [
        cp.sum(w) == 1,
        w >= 0,
        w <= max_asset_weight,
        turnover <= max_turnover
    ]

    prob = cp.Problem(objective, constraints)
    prob.solve(solver=cp.SCS)

    target_w = np.array(w.value, dtype=float) if w.value is not None else current_w.copy()
    target_w = np.clip(target_w, 0.0, 1.0)
    if np.sum(target_w) > 0:
        target_w = target_w / np.sum(target_w)

    return target_w, prob.status

def test_apde_constraints():
    n_assets = 10
    symbols = [f"SYM_{i}" for i in range(n_assets)]
    
    # Random but deterministic setup
    np.random.seed(42)
    mu_array = np.random.uniform(0.01, 0.15, n_assets)
    
    # Make a positive semi-definite covariance matrix
    A = np.random.rand(n_assets, n_assets)
    cov_matrix = np.dot(A, A.transpose()) * 0.01
    
    # Start with equal weights
    current_w = np.ones(n_assets) / n_assets

    target_w, status = canonical_apde_solve(mu_array, cov_matrix, current_w, n_assets, symbols)

    # 1. weights sum to 1
    assert np.isclose(np.sum(target_w), 1.0, atol=1e-4)

    # 2. weights are non-negative
    assert np.all(target_w >= -1e-5)

    # 3. max individual weight <= 0.20
    assert np.max(target_w) <= 0.20 + 1e-4

    # 4. L1 turnover <= 0.15
    turnover = np.sum(np.abs(target_w - current_w))
    assert turnover <= 0.15 + 1e-4

    # 5. valid CVXPY/SCS solver status
    assert status in ["optimal", "optimal_inaccurate"]

    # 6. correct output dimensions
    assert target_w.shape == (n_assets,)

    # 7. deterministic output for identical inputs
    target_w_2, _ = canonical_apde_solve(mu_array, cov_matrix, current_w, n_assets, symbols)
    assert np.allclose(target_w, target_w_2)

if __name__ == "__main__":
    pytest.main(["-v", __file__])
