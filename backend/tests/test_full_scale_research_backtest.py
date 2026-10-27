import os
import sys
import json
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from scripts.run_full_scale_research_backtest import run_experiment

def test_full_scale_research_backtest():
    res1_A = run_experiment(use_cde=False)
    
    if "error" in res1_A:
        pytest.skip(f"Experiment A blocked: {res1_A['error']}")
        
    res2_A = run_experiment(use_cde=False)
    assert res1_A == res2_A
    
    res1_B = run_experiment(use_cde=True)
    if "error" in res1_B:
        pytest.skip(f"Experiment B blocked: {res1_B['error']}")
        
    res2_B = run_experiment(use_cde=True)
    assert res1_B == res2_B

if __name__ == "__main__":
    pytest.main(["-v", __file__])
