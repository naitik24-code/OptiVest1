import numpy as np
import cvxpy as cp

class APDEService:
    @staticmethod
    def optimize_portfolio(mu: np.ndarray, cov_mat: np.ndarray, prev_w: np.ndarray, 
                           tau: float = 3.0, asset_cap: bool = True, 
                           use_tc: bool = True, turnover_cap: float = 0.15, eps: float = 1e-7) -> np.ndarray:
        """
        Production APDE (Autonomous Portfolio Decision Engine) using CVXPY and SCS.
        Matches the research formulation precisely.
        """
        n = len(mu)
        if prev_w is None:
            prev_w = np.ones(n) / n
            
        w = cp.Variable(n)
        tc_penalty = 0.0010 * cp.norm(w - prev_w, 1) if use_tc else 0
        
        # Objective: Maximize expected return - risk penalty - transaction cost
        objective = cp.Maximize(mu.T @ w - tau * cp.quad_form(w, cov_mat) - tc_penalty)
        
        # Constraints
        constraints = [
            cp.sum(w) == 1, 
            w >= 0
        ]
        
        if asset_cap:
            constraints.append(w <= 0.20)
            
        if turnover_cap is not None:
            constraints.append(cp.norm(w - prev_w, 1) <= turnover_cap)
            
        prob = cp.Problem(objective, constraints)
        
        try:
            prob.solve(solver=cp.SCS, eps=eps)
            w_val = w.value
            if w_val is not None:
                # Clean weights if asset cap was requested (to strictly enforce boundary despite solver float precision)
                if asset_cap:
                    w_val = np.clip(w_val, 0.0, 0.20)
                    s = np.sum(w_val)
                    if s > 0:
                        w_val = w_val / s
                    else:
                        w_val = np.ones(n) / n
                return w_val
            return prev_w
        except Exception:
            return prev_w
