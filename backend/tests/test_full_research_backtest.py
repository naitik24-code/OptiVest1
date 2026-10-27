import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from scripts.run_full_research_backtest import run_experiment

def test_full_research_backtest():
    res1 = run_experiment(1)
    res2 = run_experiment(2)
    
    # Assert determinism
    assert res1 == res2
    
    assert "portfolio_return" in res1
    assert "volatility" in res1
    assert "sharpe" in res1
    
    assert not (res1["portfolio_return"] != res1["portfolio_return"])

if __name__ == "__main__":
    pytest.main(["-v", __file__])
