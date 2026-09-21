from typing import List, Dict, Optional
import uuid
import logging

logger = logging.getLogger(__name__)

class DecisionGuardrailException(Exception):
    pass

class DecisionCycle:
    def __init__(self, kill_switch_active: bool = False, max_weight: float = 0.20, max_turnover: float = 0.15):
        self.kill_switch_active = kill_switch_active
        self.max_weight = max_weight
        self.max_turnover = max_turnover
        
    def trigger_kill_switch(self):
        """Activates the global kill switch to halt all autonomous trading."""
        self.kill_switch_active = True
        logger.critical("KILL SWITCH ACTIVATED. All autonomous trading halted.")
        
    def release_kill_switch(self):
        """Deactivates the global kill switch."""
        self.kill_switch_active = False
        logger.info("Kill switch deactivated. Autonomous trading resumed.")
        
    def evaluate_decision(self, current_weight: float, target_weight: float) -> str:
        """
        Evaluates a decision against guardrails.
        Returns 'APPROVED' if passes, 'REJECTED' otherwise.
        """
        if self.kill_switch_active:
            raise DecisionGuardrailException("Decision rejected: Kill switch is active.")
            
        if target_weight > self.max_weight + 1e-4:
            raise DecisionGuardrailException(f"Decision rejected: Target weight {target_weight:.3f} exceeds max {self.max_weight}.")
            
        turnover = abs(target_weight - current_weight)
        # We apply max_turnover at the portfolio level in APDE, but we can do a sanity check here too
        # To avoid being too restrictive at asset level, we just check against max_turnover 
        # (Though usually turnover is a sum across assets, so a single asset moving > 0.15 is bad)
        if turnover > self.max_turnover + 1e-4:
             raise DecisionGuardrailException(f"Decision rejected: Turnover {turnover:.3f} exceeds max {self.max_turnover}.")
             
        return "APPROVED"
        
    def process_portfolio_reallocation(self, current_weights: Dict[str, float], target_weights: Dict[str, float]) -> Dict[str, str]:
        """
        Processes a full reallocation.
        """
        if self.kill_switch_active:
            raise DecisionGuardrailException("Reallocation rejected: Kill switch is active.")
            
        # Check global turnover
        turnover = sum(abs(target_weights.get(a, 0.0) - current_weights.get(a, 0.0)) 
                      for a in set(target_weights) | set(current_weights))
        
        if turnover > self.max_turnover + 1e-4:
            raise DecisionGuardrailException(f"Reallocation rejected: Total turnover {turnover:.3f} exceeds {self.max_turnover}.")
            
        # Check individual weights
        statuses = {}
        for asset, tw in target_weights.items():
            cw = current_weights.get(asset, 0.0)
            try:
                status = self.evaluate_decision(cw, tw)
                statuses[asset] = status
            except DecisionGuardrailException as e:
                logger.warning(f"Asset {asset} failed guardrail: {str(e)}")
                statuses[asset] = "REJECTED"
                
        # If any rejected, we might reject the whole batch or partial. Let's do partial or full reject based on strictness.
        if "REJECTED" in statuses.values():
            raise DecisionGuardrailException("Reallocation rejected: One or more asset guardrails failed.")
            
        return statuses
