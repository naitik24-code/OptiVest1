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
        self.last_rebalance_date = None
        
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

    def is_rebalance_due(self, current_date: 'datetime') -> bool:
        """21-day scheduler logic."""
        if self.last_rebalance_date is None:
            return True
        delta = (current_date - self.last_rebalance_date).days
        return delta >= 21

    def run_cycle(self, portfolio_id: str, current_date: 'datetime', db_session, 
                  user_id: str, cde_service, apde_service, explain_service,
                  current_weights: Dict[str, float], prices: Dict[str, float], 
                  require_approval: bool = True):
        """
        Executes the full decision cycle.
        """
        import uuid
        from datetime import datetime, timezone
        from app.models.decision import Decision
        from app.models.ledger import Ledger
        from app.models.decision_audit import DecisionAudit
        
        if self.kill_switch_active:
            logger.warning("Cycle skipped: Kill switch active")
            return None

        if not self.is_rebalance_due(current_date):
            logger.info("Cycle skipped: Rebalance not due yet")
            return None
            
        if not prices:
            logger.error("Cycle failed: Data failure (no prices)")
            return None

        # Idempotency check: check if decision already exists for this portfolio on this date
        start_of_day = datetime(current_date.year, current_date.month, current_date.day, tzinfo=timezone.utc)
        import uuid
        try:
            port_uuid = uuid.UUID(portfolio_id)
        except ValueError:
            port_uuid = portfolio_id
            
        existing_decision = db_session.query(Decision).filter(
            Decision.portfolio_id == port_uuid,
            Decision.timestamp >= start_of_day
        ).first()
        if existing_decision:
            logger.info("Cycle skipped: Idempotency check (already run today)")
            return existing_decision

        try:
            # 1. CDE
            candidates = cde_service.discover_candidates(portfolio_id)
            if not candidates:
                candidates = []
                
            # 2. APDE
            # Construct mu and cov_mat based on available ML predictions and historical data
            # For this service layer cycle, APDE is expected to take care of it via generate_recommendations
            # But the prompt requires calling APDE and APDEService (CVXPY) directly.
            # Assuming APDEService.optimize_portfolio(...)
            # To simulate the pipeline, we use APDEService directly.
            # We'll just call a wrapper or the real service.
            target_weights = apde_service.generate_target_weights(portfolio_id, candidates, current_weights)
            
            # 3. Guardrails
            self.process_portfolio_reallocation(current_weights, target_weights)
            
            if require_approval:
                logger.info("Cycle paused: Portfolio approval gate requires user consent")
                # Create PENDING decision
                status = "PENDING"
            else:
                status = "EXECUTED"
                
            # 4. Explain & Audit
            # Calculate total turnover
            turnover = sum(abs(target_weights.get(a, 0.0) - current_weights.get(a, 0.0)) 
                          for a in set(target_weights) | set(current_weights)) / 2.0
                          
            # Calculate cost (10 bps/trade)
            total_portfolio_value = 100000.0 # Mock value for calculation
            trade_cost = turnover * total_portfolio_value * 0.0010
            
            # Create Decision records for each asset
            decisions = []
            for asset, tw in target_weights.items():
                cw = current_weights.get(asset, 0.0)
                if abs(tw - cw) < 1e-6:
                    continue # No decision needed for no change? Or maybe just HOLD
                
                dw = tw - cw
                decision_type = "BUY" if dw > 0 else "SELL"
                if abs(dw) < 1e-4:
                    decision_type = "HOLD"
                    
                asset_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, asset)
                decision = Decision(
                    id=uuid.uuid4(),
                    portfolio_id=port_uuid,
                    asset_id=asset_uuid,
                    decision_type=decision_type,
                    target_weight=tw,
                    confidence_score=0.9,
                    status=status,
                    timestamp=current_date
                )
                db_session.add(decision)
                decisions.append(decision)
                
            if not decisions:
                # If no trades needed, return a dummy success
                return []
                
            if status == "EXECUTED":
                # Create Ledger entry
                ledger = Ledger(
                    id=uuid.uuid4(),
                    portfolio_id=port_uuid,
                    entry_type="FEE",
                    amount=trade_cost,
                    balance_after=-trade_cost, # placeholder
                    timestamp=current_date
                )
                db_session.add(ledger)
                self.last_rebalance_date = current_date
                
            db_session.commit()
            
            # Optional: generate SHAP narratives for the decision
            for decision in decisions:
                if decision.decision_type == "HOLD":
                    continue
                    
                asset = next((a for a, tw in target_weights.items() if uuid.uuid5(uuid.NAMESPACE_DNS, a) == decision.asset_id), None)
                if not asset: continue
                
                cw = current_weights.get(asset, 0.0)
                tw = target_weights.get(asset, 0.0)
                dw = tw - cw
                
                explanation = explain_service.get_cached_or_compute(asset, current_date)
                if explanation:
                    narrative = explain_service.generate_narrative(asset, decision.decision_type, explanation, round(abs(dw)*10000))
                    audit = DecisionAudit(
                        decision_id=decision.id,
                        base_value=explanation["base_value"],
                        r_hat=explanation["r_hat"],
                        shap_values=explanation["shap_values"],
                        narrative=narrative
                    )
                    db_session.add(audit)
                        
            db_session.commit()
            return decisions

        except DecisionGuardrailException as e:
            logger.warning(f"Cycle aborted due to guardrail: {e}")
            db_session.rollback()
            return None
        except Exception as e:
            logger.error(f"Cycle failed: Solver or internal error - {e}")
            db_session.rollback()
            return None
