import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.services.decision_cycle import DecisionCycle, DecisionGuardrailException

def test_decision_cycle_kill_switch():
    cycle = DecisionCycle()
    
    # Normal operation
    assert cycle.evaluate_decision(0.0, 0.10) == "APPROVED"
    
    # Activate kill switch
    cycle.trigger_kill_switch()
    with pytest.raises(DecisionGuardrailException, match="Kill switch is active"):
        cycle.evaluate_decision(0.0, 0.10)
        
    with pytest.raises(DecisionGuardrailException, match="Kill switch is active"):
        cycle.process_portfolio_reallocation({"AAPL": 0.05}, {"AAPL": 0.10})
        
    # Release kill switch
    cycle.release_kill_switch()
    assert cycle.evaluate_decision(0.0, 0.10) == "APPROVED"

def test_decision_cycle_weight_guardrail():
    cycle = DecisionCycle(max_weight=0.20)
    
    assert cycle.evaluate_decision(0.15, 0.20) == "APPROVED"
    
    with pytest.raises(DecisionGuardrailException, match="exceeds max 0.2"):
        cycle.evaluate_decision(0.15, 0.21)

def test_decision_cycle_turnover_guardrail():
    cycle = DecisionCycle(max_turnover=0.15)
    
    # Asset turnover
    assert cycle.evaluate_decision(0.0, 0.15) == "APPROVED"
    with pytest.raises(DecisionGuardrailException, match="exceeds max 0.15"):
        cycle.evaluate_decision(0.0, 0.16)
        
    # Portfolio turnover
    current = {"AAPL": 0.10, "MSFT": 0.10}
    target = {"AAPL": 0.18, "MSFT": 0.02} # Turnover is abs(0.18-0.10) + abs(0.02-0.10) = 0.08 + 0.08 = 0.16
    
    with pytest.raises(DecisionGuardrailException, match="exceeds 0.15"):
        cycle.process_portfolio_reallocation(current, target)
        
    # Valid portfolio turnover
    valid_target = {"AAPL": 0.15, "MSFT": 0.05} # Turnover = 0.05 + 0.05 = 0.10
    statuses = cycle.process_portfolio_reallocation(current, valid_target)
    assert statuses["AAPL"] == "APPROVED"
    assert statuses["MSFT"] == "APPROVED"
