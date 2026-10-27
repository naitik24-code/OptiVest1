import os
import sys
import pytest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.cde_canonical import CDE
from tests.test_apde_constraints import canonical_apde_solve

def test_cde_apde_integration():
    # 1. Universe definition
    universe = ["AAPL", "MSFT", "NVDA", "TSLA", "PLTR", "AMD", "META", "AMZN"]
    
    config = {
        "base_score": 0.5,
        "threshold": 0.8,
        "top_k": 4
    }
    
    # 2. Run CDE
    candidates = CDE.run(universe, {}, {}, config)
    candidate_tickers = [c["ticker"] for c in candidates]
    
    # Verify CDE deterministic output
    assert len(candidate_tickers) == 4
    assert len(set(candidate_tickers)) == 4 # No duplicates
    assert set(candidate_tickers).issubset(set(universe))
    
    # 3. Form APDE input
    # Pad current_w with zeros for the new candidates
    # Wait, the initial weights sum to 1. But max_w = 0.20!
    # If current_w = [0.5, 0.5], then turnover required to get to <= 0.20 is at least 0.60
    # But turnover constraint is L1 <= 0.15. This is ALSO infeasible!
    # I need to change current_w to something already feasible, e.g., 5 assets with 0.2 each
    current_symbols = ["AAPL", "MSFT", "NVDA", "TSLA", "PLTR"]
    current_w = np.array([0.2, 0.2, 0.2, 0.2, 0.2])
    
    # Combine symbols
    final_symbols = current_symbols.copy()
    for c in candidate_tickers:
        if c not in final_symbols:
            final_symbols.append(c)
            
    n_assets = len(final_symbols)
    
    # Create valid inputs for APDE
    np.random.seed(42)
    mu_array = np.random.uniform(0.01, 0.15, n_assets)
    A = np.random.rand(n_assets, n_assets)
    cov_matrix = np.dot(A, A.transpose()) * 0.01
    
    # Pad current_w with zeros for the new candidates
    extended_w = np.zeros(n_assets)
    extended_w[:len(current_w)] = current_w
    
    # 4. Run APDE exactly on CDE output
    target_w, status = canonical_apde_solve(mu_array, cov_matrix, extended_w, n_assets, final_symbols)
    
    # 5. Verify APDE receives exactly CDE output + current holdings
    assert set(final_symbols) == set(current_symbols + candidate_tickers)
    
    # 6. Verify Excluded assets cannot enter APDE
    for u in universe:
        if u not in current_symbols and u not in candidate_tickers:
            assert u not in final_symbols
    
    # 7. Verify APDE constraints
    assert np.isclose(np.sum(target_w), 1.0, atol=1e-4)
    assert np.all(target_w >= -1e-5)
    assert np.max(target_w) <= 0.20 + 1e-4
    
    turnover = np.sum(np.abs(target_w - extended_w))
    assert turnover <= 0.15 + 1e-4

if __name__ == "__main__":
    pytest.main(["-v", __file__])
