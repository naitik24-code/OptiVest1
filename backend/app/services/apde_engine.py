"""
Phase 6 — Adaptive Portfolio Decision Engine (APDE) Core Services
Real implementation replacing mocks with actual Mean-Variance Optimization.
"""
import uuid
import json
import logging
import pandas as pd
import numpy as np
from scipy.optimize import minimize
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.holding import Holding
from app.models.portfolio import Portfolio
from app.models.market_price import MarketPrice
from app.models.user_preference import UserPreference
from app.models.paper_trading import PaperPosition
from app.models.apde import (
    PortfolioHealth, PortfolioAnalysis, DecisionCard,
    DecisionHistory, DecisionScore, OptimizationResult,
    ScenarioSimulation, PortfolioSnapshot
)
from app.services.prediction_engine import PredictionEngine
from app.services.market_regime_detector import market_regime_detector
from app.core.config import settings

logger = logging.getLogger("optivest.apde")

ASSET_SECTOR_MAP = {
    "AAPL": "Technology", "MSFT": "Technology", "NVDA": "Technology",
    "TSLA": "Consumer Cyclical", "PLTR": "Technology", "AMD": "Technology",
    "JNJ": "Healthcare", "XOM": "Energy", "SPY": "Index"
}

class APDEEngine:
    """Core Orchestrator for the Adaptive Portfolio Decision Engine."""

    def __init__(self, db: Session):
        self.db = db
        self.prediction_engine = PredictionEngine(db)
        
    def _get_historical_returns(self, symbols: List[str], lookback_days: int = 252) -> pd.DataFrame:
        start_date = datetime.now() - timedelta(days=lookback_days)
        prices = self.db.query(MarketPrice.symbol, MarketPrice.timestamp, MarketPrice.close).filter(
            MarketPrice.symbol.in_(symbols),
            MarketPrice.timestamp >= start_date
        ).all()
        
        df = pd.DataFrame(prices, columns=['symbol', 'timestamp', 'close'])
        if df.empty:
            return pd.DataFrame()
            
        df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True)
        df = df.drop_duplicates(subset=['timestamp', 'symbol'])
        pivot = df.pivot(index='timestamp', columns='symbol', values='close').sort_index()
        pivot = pivot.ffill().bfill()
        return pivot.pct_change().dropna()

    def _get_latest_prices(self, symbols: List[str]) -> Dict[str, float]:
        """Return the latest observed close for each symbol.

        Price based rules must use prices, never the last observation from a
        returns series.  Missing symbols are intentionally omitted so callers
        can distinguish unavailable data from a flat price.
        """
        rows = self.db.query(MarketPrice.symbol, MarketPrice.timestamp, MarketPrice.close).filter(
            MarketPrice.symbol.in_(symbols)
        ).order_by(MarketPrice.timestamp.desc()).all()
        latest: Dict[str, float] = {}
        for symbol, _timestamp, close in rows:
            if symbol not in latest and close is not None:
                latest[symbol] = float(close)
        return latest

    def _get_covariance_matrix(self, symbols: List[str], lookback_days: int = 252) -> pd.DataFrame:
        """Fetch historical prices and compute actual covariance matrix."""
        returns = self._get_historical_returns(symbols, lookback_days)
        
        if returns.empty or len(returns) < 30:
            # Fallback to diagonal if not enough data
            return pd.DataFrame(np.eye(len(symbols)) * 0.04, index=symbols, columns=symbols)
            
        # Annualized covariance
        cov = returns.cov() * 252
        
        # Ensure all requested symbols exist in cov matrix
        cov = cov.reindex(index=symbols, columns=symbols).fillna(0.0)
        cov_vals = cov.to_numpy(copy=True)
        np.fill_diagonal(cov_vals, np.where(np.diag(cov_vals) == 0, 0.04, np.diag(cov_vals)))
        return pd.DataFrame(cov_vals, index=symbols, columns=symbols)

    def _get_expected_returns(self, symbols: List[str], horizon: str = "5D") -> Dict[str, float]:
        """Fetch real predictions from Phase 5."""
        returns = {}
        for sym in symbols:
            if sym == "CASH":
                returns[sym] = 0.02 # 2% annualized risk-free rate assumption
                continue
                
            pred = self.prediction_engine.generate_prediction(sym, horizon, save_to_db=False)
            if "error" not in pred:
                # Convert the period return to annualized for apples-to-apples optimization
                horizon_days = {"1D": 1, "5D": 5, "10D": 10, "20D": 20, "30D": 30, "90D": 90}.get(horizon, 5)
                ann_return = pred["predicted_return"] * (252 / horizon_days)
                returns[sym] = ann_return
            else:
                # Fallback to historical mean or 0
                returns[sym] = 0.0
        return returns

    # ════════════════════════════════════════════════════════════════════════
    # ENGINE 1 — PORTFOLIO HEALTH ENGINE
    # ════════════════════════════════════════════════════════════════════════
    def calculate_portfolio_health(self, portfolio_id: str, risk_tolerance: str = "moderate") -> Dict[str, Any]:
        """Calculates Health Score based on REAL portfolio and covariance metrics."""
        try:
            p_uuid = uuid.UUID(portfolio_id)
        except ValueError:
            p_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(portfolio_id))

        holdings = self.db.query(Holding).filter(Holding.portfolio_id == p_uuid).all()
        weights = {}

        if holdings:
            total_val = sum(h.quantity * (h.average_buy_price or 100.0) for h in holdings)
            if total_val <= 0: total_val = 1.0
            weights = {h.asset.symbol: float((h.quantity * (h.average_buy_price or 100.0)) / total_val) for h in holdings if h.asset}

        if not weights:
            # Fallback to PaperPositions or default test portfolio symbols
            paper_pos = self.db.query(PaperPosition).filter(PaperPosition.wallet_id == str(portfolio_id)).all()
            if paper_pos:
                tot = sum(p.quantity * p.current_price for p in paper_pos) or 1.0
                weights = {p.symbol: float((p.quantity * p.current_price) / tot) for p in paper_pos}
            else:
                # Fallback default positions for new/empty portfolio evaluation
                weights = {"TSLA": 0.40, "PLTR": 0.30, "AMD": 0.30}

        symbols = list(weights.keys())
        
        # Real Covariance & Returns
        cov_matrix = self._get_covariance_matrix(symbols)
        exp_rets = self._get_expected_returns(symbols)
        
        w_array = np.array([weights[sym] for sym in symbols])
        mu_array = np.array([exp_rets[sym] for sym in symbols])
        
        port_return = float(np.dot(w_array, mu_array))
        port_variance = float(np.dot(w_array.T, np.dot(cov_matrix.values, w_array)))
        port_volatility = float(np.sqrt(port_variance))
        
        asset_conc = float(max(weights.values())) if weights else 0.0

        # Sector breakdown
        sectors = {}
        for h in holdings:
            sec = getattr(h.asset, "sector", None) or "Unknown"
            w = weights.get(h.asset.symbol, 0.0)
            sectors[sec] = round(sectors.get(sec, 0.0) + w, 4)
        sector_conc = float(max(sectors.values())) if sectors else 0.0

        # Herfindahl Index for diversification
        hhi = sum(w ** 2 for w in weights.values())
        div_score = max(0.0, min(100.0, (1.0 - hhi) * (n_assets / (n_assets - 1)) * 100.0)) if (n_assets := len(weights)) > 1 else 0.0

        risk_free_rate = 0.02
        sharpe = round((port_return - risk_free_rate) / max(port_volatility, 0.0001), 4)
        
        # Real Sortino and Max Drawdown calculation
        hist_returns = self._get_historical_returns(symbols + ["SPY"])
        if not hist_returns.empty:
            available_symbols = [s for s in symbols if s in hist_returns.columns]
            # Align the weight vector explicitly with the return columns. A
            # portfolio can contain assets with different market-data history;
            # pandas.DataFrame.dot otherwise raises a 500 on label/order
            # mismatch instead of calculating the available portfolio return.
            if available_symbols:
                return_frame = hist_returns[available_symbols]
                w_series = pd.Series({s: weights[s] for s in available_symbols}).reindex(return_frame.columns)
                port_hist_returns = return_frame.dot(w_series)
            else:
                port_hist_returns = pd.Series(dtype=float)
            
            # Sortino
            negative_returns = port_hist_returns[port_hist_returns < 0]
            downside_std = negative_returns.std() * np.sqrt(252)
            sortino = round((port_return - risk_free_rate) / max(downside_std, 0.0001), 4) if not np.isnan(downside_std) and downside_std > 0 else 0.0
            
            # Max Drawdown
            cum_returns = (1 + port_hist_returns).cumprod()
            cum_max = cum_returns.cummax()
            drawdowns = (cum_returns - cum_max) / cum_max
            max_dd = round(abs(drawdowns.min()), 4) if not np.isnan(drawdowns.min()) else 0.0
            
            # Beta to SPY
            if "SPY" in hist_returns.columns:
                cov_with_spy = port_hist_returns.cov(hist_returns["SPY"])
                var_spy = hist_returns["SPY"].var()
                beta = round(cov_with_spy / max(var_spy, 0.0001), 2) if var_spy > 0 else 1.0
            else:
                beta = 1.0
            # VaR and CVaR (95%)
            var_95 = 0.0
            cvar_95 = 0.0
            if len(port_hist_returns) > 0:
                var_val = np.percentile(port_hist_returns, 5)
                var_95 = round(var_val * 100, 2)
                cvar_val = port_hist_returns[port_hist_returns <= var_val].mean()
                if not np.isnan(cvar_val):
                    cvar_95 = round(cvar_val * 100, 2)

        else:
            sortino = 0.0
            max_dd = 0.0
            beta = 1.0
            var_95 = 0.0
            cvar_95 = 0.0

        # Better Health Score Algorithm (0-100)
        p_div = (div_score / 100.0) * 20.0
        p_sharpe = min(max((sharpe + 1.0) / 3.0, 0.0), 1.0) * 25.0
        p_vol = max(0.0, 15.0 - (port_volatility / 0.4) * 15.0)
        p_dd = max(0.0, 15.0 - (max_dd / 0.4) * 15.0)
        p_aconc = (1.0 - asset_conc) * 15.0
        p_sconc = (1.0 - sector_conc) * 10.0
        
        # Adjust weights based on risk tolerance
        if risk_tolerance == "conservative":
            p_vol = max(0.0, 15.0 - (port_volatility / 0.2) * 15.0)
            p_dd = max(0.0, 15.0 - (max_dd / 0.2) * 15.0)
        elif risk_tolerance == "aggressive":
            p_sharpe = min(max((sharpe + 0.5) / 3.5, 0.0), 1.0) * 30.0
            p_vol = max(0.0, 10.0 - (port_volatility / 0.5) * 10.0)
            p_dd = max(0.0, 10.0 - (max_dd / 0.5) * 10.0)

        health_score = float(np.clip(p_div + p_sharpe + p_vol + p_dd + p_aconc + p_sconc, 0.0, 100.0))

        if health_score >= 80: rating = "EXCELLENT"
        elif health_score >= 60: rating = "GOOD"
        elif health_score >= 40: rating = "FAIR"
        else: rating = "POOR"

        result = {
            "portfolio_id": portfolio_id,
            "health_score": round(health_score, 1),
            "diversification_score": round(div_score, 1),
            "risk_score": round(port_volatility * 100, 1),
            "overall_health_rating": rating,
            "sector_concentration": round(sector_conc, 4),
            "asset_concentration": round(asset_conc, 4),
            "expected_return_annual": round(port_return, 4),
            "portfolio_volatility": round(port_volatility, 4),
            "sharpe_ratio": sharpe,
            "sortino_ratio": sortino,
            "max_drawdown_pct": max_dd,
            "beta": beta,
            "alpha": round(port_return - (0.02 + beta * (0.08 - 0.02)), 4),
            "historical_var_95_pct": var_95,
            "historical_cvar_95_pct": cvar_95,
            "correlation_matrix": cov_matrix.to_dict(),
            "sector_breakdown": sectors,
            "asset_allocations": weights,
        }

        try:
            ph = PortfolioHealth(
                id=str(uuid.uuid4()), portfolio_id=portfolio_id,
                health_score=float(result["health_score"]),
                diversification_score=float(result["diversification_score"]),
                risk_score=float(result["risk_score"]),
                overall_health_rating=result["overall_health_rating"],
                sector_concentration=float(result["sector_concentration"]),
                asset_concentration=float(result["asset_concentration"]),
                expected_return_annual=float(result["expected_return_annual"]),
                portfolio_volatility=float(result["portfolio_volatility"]),
                sharpe_ratio=float(result["sharpe_ratio"]),
                sortino_ratio=float(result["sortino_ratio"]),
                max_drawdown_pct=float(result["max_drawdown_pct"]),
                beta=float(result["beta"]), alpha=float(result["alpha"]),
                correlation_matrix=json.dumps(result["correlation_matrix"]),
                sector_breakdown=json.dumps(result["sector_breakdown"]),
                asset_allocations=json.dumps(result["asset_allocations"]),
            )
            self.db.add(ph)
            self.db.commit()
        except Exception as e:
            logger.error(f"Failed to save portfolio health: {e}")
            self.db.rollback()

        return result

    # ════════════════════════════════════════════════════════════════════════
    # ENGINE 2 & 3 & 4 — ADAPTIVE DECISION & REBALANCING & SCENARIO SIMULATOR
    # ════════════════════════════════════════════════════════════════════════
    def generate_recommendations(self, portfolio_id: str, horizon: str = "5D", candidate_symbols: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Generates decision cards using mathematical mean-variance optimization."""
        health = self.calculate_portfolio_health(portfolio_id)
        allocations = health["asset_allocations"]

        symbols = list(allocations.keys())
        
        # CDE candidates are now part of the normal recommendation path.  The
        # endpoint can still inject an explicit shortlist for deterministic
        # what-if runs, but callers no longer need to know this implementation
        # detail.
        if candidate_symbols is None:
            try:
                from app.services.candidate_discovery_service import CandidateDiscoveryService
                candidate_rows = CandidateDiscoveryService(self.db).discover_candidates(
                    portfolio_id, candidate_type="REPLACEMENT", top_n=10
                )
                candidate_symbols = [row["ticker"] for row in candidate_rows]
            except Exception as exc:
                logger.warning("Candidate discovery unavailable; using current holdings only: %s", exc)
                candidate_symbols = []
        if candidate_symbols:
            for cs in candidate_symbols:
                if cs not in symbols:
                    symbols.append(cs)
                    allocations[cs] = 0.0

        n_assets = len(symbols)
        
        if n_assets < 2:
            return []

        # Real inputs
        cov_matrix = self._get_covariance_matrix(symbols).values
        
        # --- Phase 21: Sentiment Analysis NLP Injection ---
        from app.services.sentiment_engine import sentiment_engine
        sentiment_data = sentiment_engine.analyze_market_sentiment(symbols)
        
        # Dynamically penalize covariance during market shocks (inflate variance)
        if sentiment_data["is_shock_regime"]:
            cov_matrix = cov_matrix * sentiment_data["global_risk_multiplier"]
            
        exp_rets = self._get_expected_returns(symbols, horizon)
        
        # Get User Preferences and Portfolio UUID
        try:
            p_uuid = uuid.UUID(portfolio_id)
        except:
            p_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(portfolio_id))
            
        # --- 14-Day Momentum & Stop-Loss Penalties ---
        hist_14 = self._get_historical_returns(symbols, 14)
        latest_prices = self._get_latest_prices(symbols)
        cum_ret_14 = {}
        if not hist_14.empty:
            for sym in symbols:
                if sym in hist_14.columns:
                    cum_ret_14[sym] = float((1 + hist_14[sym]).prod() - 1.0)
                else:
                    cum_ret_14[sym] = 0.0
                    
        # Check for recently bought assets that are failing (Stop-Loss)
        from app.models.holding import Holding
        from app.models.asset import Asset
        holdings = self.db.query(Holding, Asset).join(Asset).filter(Holding.portfolio_id == p_uuid).all()
        buy_prices = {asset.symbol: holding.average_buy_price for holding, asset in holdings if holding.average_buy_price > 0}
        
        penalty_reasons = {}
        for sym in symbols:
            # 1. 14-Day Momentum Penalty
            ret_14 = cum_ret_14.get(sym, 0.0)
            if ret_14 < -0.05: # Down more than 5% in 14 days
                exp_rets[sym] -= 0.10 # Massive penalty
                penalty_reasons[sym] = f"Poor 14-day performance (Down {abs(ret_14)*100:.1f}%)"
                
            # 2. Reallocated Stock Stop-Loss Penalty
            if sym in buy_prices:
                buy_px = buy_prices[sym]
                # Get current price
                curr_px = latest_prices.get(sym)
                loss = (curr_px - buy_px) / buy_px if curr_px is not None and buy_px else None
                if loss is not None and loss < -0.05: # Stop loss at 5% drop from buy price
                    exp_rets[sym] -= 0.20 # Extreme penalty forcing exit
                    penalty_reasons[sym] = f"Stop-Loss triggered (Down {abs(loss)*100:.1f}% from average buy price)"

        # --- Phase 22: Tax-Loss Harvesting ---
        # Penalize selling assets that have unrealized short-term capital gains
        # Deployment/account policy input; this is an assumption unless the
        # user supplies account-specific tax-lot information.
        tax_rate = float(settings.APDE_TAX_RATE)
        tax_penalty = np.zeros(n_assets)
        
        for i, sym in enumerate(symbols):
            if sym in buy_prices:
                buy_px = buy_prices[sym]
                curr_px = latest_prices.get(sym)
                gain_pct = (curr_px - buy_px) / buy_px if curr_px is not None and buy_px else 0.0
                if gain_pct > 0:
                    # If sold, we lose tax_rate * gain_pct of the sale value
                    # We will apply this as a penalty to the (w0 - w) term later
                    tax_penalty[i] = tax_rate * gain_pct

        mu_array = np.array([exp_rets[sym] for sym in symbols])
        current_w = np.array([allocations[sym] for sym in symbols])

        # Get User Preferences (Risk Tolerance)
        port = self.db.query(Portfolio).filter(Portfolio.id == p_uuid).first()
        user_id = port.user_id if port else None
        pref = self.db.query(UserPreference).filter(UserPreference.user_id == user_id).first() if user_id else None
        
        import cvxpy as cp

        # Define Optimization Parameters
        risk_level = pref.risk_tolerance_level if pref else 3
        tau = {1: 5.0, 2: 3.5, 3: 2.0, 4: 1.0, 5: 0.5}.get(risk_level, 2.0)
        gamma = 0.0010

        # Use canonical constraint parameters from the research paper
        max_asset_weight = float(settings.APDE_MAX_ASSET_WEIGHT)
        max_turnover = float(settings.APDE_MAX_TURNOVER)

        # CVXPY Variables
        w = cp.Variable(n_assets)
        
        # Expected Returns, Covariance, Initial Weights
        r_hat = mu_array
        Sigma_h = cov_matrix
        w0 = current_w

        # Objective Function: Maximize w^T r_hat - tau * w^T Sigma_h w - gamma * ||w - w0||_1
        # In CVXPY, maximizing f(x) is minimizing -f(x)
        expected_return = r_hat @ w
        risk = cp.quad_form(w, Sigma_h)
        turnover = cp.norm(w - w0, 1)
        
        # Tax penalty only applies when w < w0 (we are selling)
        # cp.pos(w0 - w) represents the amount sold.
        tax_loss_term = tax_penalty @ cp.pos(w0 - w)

        objective = cp.Maximize(expected_return - tau * risk - gamma * turnover - tax_loss_term)

        # Canonical Constraints
        constraints = [
            cp.sum(w) == 1,
            w >= 0,
            w <= max_asset_weight,
            turnover <= max_turnover
        ]

        # Blacklisted assets forced to 0.0 weight
        blacklisted_assets = ["META", "BTC"]
        for i, sym in enumerate(symbols):
            if sym in blacklisted_assets:
                constraints.append(w[i] == 0.0)

        # Sector Concentration Constraints
        sector_limits = {"Technology": 0.85, "Energy": 0.15, "Healthcare": 0.25}
        for sec, max_cap in sector_limits.items():
            sec_indices = [i for i, sym in enumerate(symbols) if ASSET_SECTOR_MAP.get(sym, "Technology") == sec]
            if sec_indices:
                constraints.append(cp.sum(w[sec_indices]) <= max_cap)

        prob = cp.Problem(objective, constraints)
        
        try:
            # Using canonical SCS solver
            prob.solve(solver=cp.SCS)
            
            if prob.status in ["optimal", "optimal_inaccurate"] and w.value is not None:
                target_w = np.array(w.value, dtype=float)
            else:
                logger.warning(f"CVXPY solver failed with status {prob.status}")
                target_w = current_w.copy()
        except Exception as e:
            logger.error(f"CVXPY error: {e}")
            target_w = current_w.copy()

        # Clean up small negative weights due to solver precision
        target_w = np.clip(target_w, 0.0, 1.0)
        if np.sum(target_w) > 0:
            target_w = target_w / np.sum(target_w)
        else:
            target_w = current_w.copy()
        
        # Check if difference is meaningful
        turnover_val = np.sum(np.abs(target_w - current_w)) / 2.0
        if turnover_val < 0.005:
            return [] # No action needed

        regime_info = market_regime_detector.detect_regime("SPY")
        regime = regime_info["regime"]
        
        # Build Multi-Asset Rebalancing Package
        diffs = target_w - current_w
        reductions = {symbols[i]: float(round(abs(diffs[i]), 4)) for i in range(n_assets) if diffs[i] < -0.005}
        additions = {symbols[i]: float(round(diffs[i], 4)) for i in range(n_assets) if diffs[i] > 0.005}
        
        sell_sym = max(reductions, key=reductions.get) if reductions else symbols[0]
        buy_sym = max(additions, key=additions.get) if additions else symbols[1]
        realloc_amt = float(round(sum(reductions.values()), 4))
        
        # Dynamic Allocation Engine Step Sizing
        from app.services.dynamic_allocation_engine import DynamicAllocationEngine
        from app.services.learning_feedback_service import LearningFeedbackService

        feedback_service = LearningFeedbackService(self.db)
        fb_metrics = feedback_service.get_feedback_metrics(market_regime=regime)

        # Recalculate metrics for the card
        current_ret = float(np.dot(current_w, mu_array))
        current_risk = float(np.sqrt(np.dot(current_w.T, np.dot(cov_matrix, current_w))))
        target_ret = float(np.dot(target_w, mu_array))
        target_risk = float(np.sqrt(np.dot(target_w.T, np.dot(cov_matrix, target_w))))
        
        ret_imp = float(target_ret - current_ret)
        risk_red = float(current_risk - target_risk)
        sharpe_curr = (current_ret - 0.02) / max(current_risk, 0.0001)

        dyn_alloc = DynamicAllocationEngine.calculate_optimal_allocation(
            confidence_score=0.85 + fb_metrics["empirical_confidence_adjustment"],
            expected_return_improvement=ret_imp,
            volatility=target_risk,
            sharpe_ratio=sharpe_curr,
            risk_score=target_risk,
            market_regime=regime,
            user_max_reallocation_pct=c_realloc,
        )

        # ════ Hindsight Trade Backtester ════
        # Simulate current vs target weights over past 90 days
        hist_90 = self._get_historical_returns(symbols, 90)
        hindsight_str = ""
        if not hist_90.empty and all(s in hist_90.columns for s in symbols):
            # Fill missing to avoid NaNs
            hist_90_clean = hist_90[symbols].fillna(0)
            curr_returns = (1 + hist_90_clean.dot(current_w)).prod() - 1
            targ_returns = (1 + hist_90_clean.dot(target_w)).prod() - 1
            outperformance = (targ_returns - curr_returns) * 100
            
            if outperformance > 0.01:
                hindsight_str = f" Hindsight Backtest: Executing this 90 days ago would have yielded +{outperformance:.2f}% additional return vs the current portfolio."

        # SHAP Explainability Integration
        shap_explanation = self._get_shap_explanation(buy_sym)
        explanation_str = f"Multi-Asset Rebalance: Reduce {list(reductions.keys())} by {realloc_amt*100:.1f}%, Increase {list(additions.keys())}. Calibrated by learning feedback (success rate: {fb_metrics['success_rate']*100:.1f}%)."
        
        # Inject dynamic sell reasons if penalties triggered
        sell_reason = "Holding current weight is suboptimal"
        if sell_sym in penalty_reasons:
            sell_reason = penalty_reasons[sell_sym]
            explanation_str += f" Trigger: {sell_reason}."
            
        if shap_explanation:
            explanation_str += f" SHAP Drivers for {buy_sym}: " + ", ".join([f"{k} ({v:+.3f})" for k,v in shap_explanation.items()])
            
        explanation_str += hindsight_str

        # Mathematical Decision Score Calculation for target_asset (buy_sym)
        target_idx = symbols.index(buy_sym)
        ds_components = APDEEngine.calculate_decision_score(
            r_hat_i=mu_array[target_idx],
            Sigma_h=cov_matrix.values if hasattr(cov_matrix, 'values') else cov_matrix,
            w=target_w,
            w0=current_w,
            tau=tau,
            gamma=gamma,
            target_index=target_idx
        )

        card = self._build_decision_card(
            portfolio_id=portfolio_id,
            rec_type="MULTI_ASSET_REBALANCE",
            source_asset=sell_sym,
            target_asset=buy_sym,
            reallocation_pct=dyn_alloc["recommended_move_percentage"],
            curr_w=float(current_w[symbols.index(sell_sym)]),
            prop_w=float(target_w[symbols.index(sell_sym)]),
            forecast_term=ds_components["forecast_term"],
            risk_term=ds_components["risk_term"],
            cost_term=ds_components["cost_term"],
            decision_score=ds_components["decision_score"],
            confidence=0.85 + fb_metrics["empirical_confidence_adjustment"],
            market_regime=regime,
            explanation=explanation_str,
        )
        
        # Overwrite the default why_not_another if we have a specific sell reason
        if sell_sym in penalty_reasons:
            card["why_not_another"] = penalty_reasons[sell_sym]
            
        return [card]

    def _get_shap_explanation(self, symbol: str) -> Dict[str, float]:
        """Calculates actual TreeSHAP values for the target asset using the trained XGBoost model."""
        try:
            import shap
            import joblib
            import os
            from app.services.dataset_builder import DatasetBuilder
            
            # 1. Get XGBoost model
            db_model = self.prediction_engine._get_active_model("XGBOOST", symbol)
            if not db_model:
                return {}
            
            model_id = str(db_model.id)
            artifact_path = f"models/{model_id}.pkl"
            if not os.path.exists(artifact_path):
                alt_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "models", f"{model_id}.pkl"))
                if os.path.exists(alt_path):
                    artifact_path = alt_path
            
            if not os.path.exists(artifact_path):
                return {}
                
            artifact = joblib.load(artifact_path)
            model_obj = artifact["model"]
            
            # 2. Get latest features
            start_dt = (datetime.now() - timedelta(days=120)).strftime("%Y-%m-%d")
            end_dt = datetime.now().strftime("%Y-%m-%d")
            df = DatasetBuilder._fetch_market_data(self.db, symbol, start_dt, end_dt)
            if df.empty: return {}
            
            df = DatasetBuilder._build_features(df)
            if df.empty: return {}
            
            feature_cols = [c for c in df.columns if c not in ['split', 'target_return', 'target_direction']]
            latest_row = df.iloc[-1:][feature_cols]
            
            # 3. Calculate TreeSHAP
            explainer = shap.TreeExplainer(model_obj)
            shap_values = explainer.shap_values(latest_row)
            
            if isinstance(shap_values, list):
                shap_values = shap_values[1] # For classifier, take positive class
                
            vals = shap_values[0]
            feature_impacts = {feature_cols[i]: float(vals[i]) for i in range(len(feature_cols))}
            
            # Get top 3 features by absolute impact
            sorted_impacts = sorted(feature_impacts.items(), key=lambda x: abs(x[1]), reverse=True)
            return {k: v for k, v in sorted_impacts[:3]}
        except Exception as e:
            logger.warning(f"SHAP calculation failed for {symbol}: {e}")
            return {}

    @staticmethod
    def calculate_decision_score(r_hat_i: float, Sigma_h: np.ndarray, w: np.ndarray, w0: np.ndarray, tau: float, gamma: float, target_index: int) -> dict:
        """
        Mathematical Decision Score:
        DS_i = r_hat_i - 2*tau*(Sigma_h*w)_i - gamma*sgn(w_i-w0_i)
        """
        forecast_term = float(r_hat_i)
        marginal_risk = float(np.dot(Sigma_h, w)[target_index])
        risk_term = float(-2.0 * tau * marginal_risk)
        
        w_change = float(w[target_index] - w0[target_index])
        sgn = 1.0 if w_change > 1e-6 else (-1.0 if w_change < -1e-6 else 0.0)
        cost_term = float(-gamma * sgn)
        
        ds_i = forecast_term + risk_term + cost_term
        
        return {
            "forecast_term": forecast_term,
            "risk_term": risk_term,
            "cost_term": cost_term,
            "decision_score": ds_i
        }

    def _build_decision_card(
        self, portfolio_id: str, rec_type: str = "REBALANCE", title: str = "",
        source_asset: str = "TSLA", target_asset: str = "NVDA", reallocation_pct: float = 0.10,
        curr_w: float = 0.20, prop_w: float = 0.10, curr_alloc: float = 0.20, proposed_alloc: float = 0.10,
        forecast_term: float = 0.05, risk_term: float = -0.01, cost_term: float = -0.01, decision_score: float = 0.03,
        confidence: float = 0.85, market_regime: str = "BULL", regime: str = "BULL", model_used: str = "CVXPY_SCS",
        explanation: str = "Multi-Asset Risk/Return Optimization",
        why_this: str = "Optimized mathematical Decision Score", why_not: str = "Holding current weight is suboptimal",
        why_now: str = "Favorable market regime and predictions", why_pct: str = "Constrained by canonical limits"
    ) -> Dict[str, Any]:
        """Constructs and persists a Decision Card with mathematical explainability."""
        title = title or f"Optimize Portfolio Risk/Return: {source_asset} -> {target_asset}"

        card_id = str(uuid.uuid4())
        capital_amount = round(reallocation_pct * 100000.0, 2) # Assume 100k portfolio for UI purposes if actual unavailable

        card_dict = {
            "id": card_id,
            "portfolio_id": portfolio_id,
            "title": title,
            "recommendation_type": rec_type,
            "source_asset": source_asset,
            "target_asset": target_asset,
            "reallocation_pct": reallocation_pct,
            "capital_amount": capital_amount,
            "current_allocation_pct": curr_w,
            "proposed_allocation_pct": prop_w,
            "expected_return_improvement": forecast_term,
            "risk_reduction_pct": risk_term,
            "confidence_score": confidence,
            "decision_score": decision_score,
            "why_this_stock": why_this,
            "why_not_another": why_not,
            "why_now": why_now,
            "why_this_percentage": why_pct,
            "model_used": model_used,
            "market_regime": regime,
            "status": "PENDING",
            "score_breakdown": {
                "total_score": decision_score,
                "forecast_term": forecast_term,
                "risk_term": risk_term,
                "cost_term": cost_term,
                "confidence": confidence,
            }
        }

        try:
            row = DecisionCard(
                id=card_id, portfolio_id=portfolio_id, title=title,
                recommendation_type=rec_type, source_asset=source_asset,
                target_asset=target_asset, reallocation_pct=reallocation_pct,
                capital_amount=capital_amount, current_allocation_pct=curr_w,
                proposed_allocation_pct=prop_w,
                expected_return_improvement=forecast_term, # remapped
                risk_reduction_pct=risk_term, # remapped
                confidence_score=confidence,
                decision_score=decision_score, why_this_stock=why_this,
                why_not_another=why_not, why_now=why_now,
                why_this_percentage=why_pct, model_used=model_used,
                market_regime=regime, status="PENDING"
            )
            self.db.add(row)
            score_row = DecisionScore(
                id=str(uuid.uuid4()), card_id=card_id,
                total_score=decision_score, 
                expected_return_subscore=forecast_term,
                risk_reduction_subscore=risk_term, 
                diversification_subscore=cost_term,
                confidence_subscore=confidence, 
                regime_alignment_subscore=0.0
            )
            self.db.add(score_row)
            self.db.commit()
        except Exception as e:
            logger.error(f"Failed to save decision card: {e}")
            self.db.rollback()

        return card_dict

    # ════════════════════════════════════════════════════════════════════════
    # ENGINE 11 — WHAT-IF SIMULATOR ENGINE
    # ════════════════════════════════════════════════════════════════════════
    def run_what_if_simulation(
        self, portfolio_id: str, source_asset: str, target_asset: str, reallocation_pct: float
    ) -> Dict[str, Any]:
        """Runs an actual mathematical simulation of weight changes on the portfolio."""
        health = self.calculate_portfolio_health(portfolio_id)
        allocations = health["asset_allocations"]
        
        symbols = list(allocations.keys())
        if target_asset not in symbols:
            symbols.append(target_asset)
            allocations[target_asset] = 0.0
            
        cov_matrix = np.array(self._get_covariance_matrix(symbols).values, copy=True, dtype=float)
        exp_rets = self._get_expected_returns(symbols)
        mu_array = np.array([exp_rets[sym] for sym in symbols], dtype=float)
        
        current_w = np.array([allocations[sym] for sym in symbols], dtype=float)
        
        # Calculate Current metrics mathematically
        curr_ret = float(np.dot(current_w, mu_array))
        curr_risk = float(np.sqrt(np.dot(current_w.T, np.dot(cov_matrix, current_w))))
        curr_sharpe = float((curr_ret - 0.02) / max(curr_risk, 0.0001))
        
        # Apply shift
        sim_w = np.array(current_w, copy=True, dtype=float)
        s_idx = symbols.index(source_asset) if source_asset in symbols else -1
        t_idx = symbols.index(target_asset)
        
        if s_idx >= 0:
            actual_shift = min(float(sim_w[s_idx]), reallocation_pct)
            sim_w[s_idx] -= actual_shift
            sim_w[t_idx] += actual_shift
        else:
            sim_w[t_idx] = reallocation_pct
            if np.sum(sim_w) > 0:
                sim_w = sim_w / np.sum(sim_w)
            
        # Calculate Simulated metrics mathematically
        sim_ret = np.dot(sim_w, mu_array)
        sim_risk = np.sqrt(np.dot(sim_w.T, np.dot(cov_matrix, sim_w)))
        sim_sharpe = (sim_ret - 0.02) / max(sim_risk, 0.0001)

        result = {
            "portfolio_id": portfolio_id,
            "simulation_name": f"WHAT_IF_{source_asset}_TO_{target_asset}",
            "source_asset": source_asset,
            "target_asset": target_asset,
            "reallocation_pct": reallocation_pct,
            "current_return": float(round(curr_ret, 4)),
            "simulated_return": float(round(sim_ret, 4)),
            "return_delta": float(round(sim_ret - curr_ret, 4)),
            "current_risk": float(round(curr_risk, 4)),
            "simulated_risk": float(round(sim_risk, 4)),
            "risk_delta": float(round(sim_risk - curr_risk, 4)),
            "current_sharpe": float(round(curr_sharpe, 2)),
            "simulated_sharpe": float(round(sim_sharpe, 2)),
            "sharpe_delta": float(round(sim_sharpe - curr_sharpe, 2)),
            "diversification_delta": 0.0,
            "recommendation_assessment": "FAVORABLE" if sim_sharpe > curr_sharpe else "NEUTRAL",
        }

        try:
            row = ScenarioSimulation(
                id=str(uuid.uuid4()), portfolio_id=portfolio_id,
                source_asset=source_asset, target_asset=target_asset,
                reallocation_pct=reallocation_pct,
                current_return=result["current_return"], simulated_return=result["simulated_return"],
                current_risk=result["current_risk"], simulated_risk=result["simulated_risk"],
                current_sharpe=result["current_sharpe"], simulated_sharpe=result["simulated_sharpe"],
                diversification_delta=0.0
            )
            self.db.add(row)
            self.db.commit()
        except Exception:
            self.db.rollback()

        return result

    # ════════════════════════════════════════════════════════════════════════
    # ENGINE 9 & 10 — DECISION HISTORY & ACTION TRACKING
    # ════════════════════════════════════════════════════════════════════════
    def record_card_action(
        self, card_id: str, action: str, user_id: str, modified_pct: Optional[float] = None
    ) -> Dict[str, Any]:
        """Records user decision governance action and executes reallocation if ACCEPTED."""
        card = self.db.query(DecisionCard).filter(DecisionCard.id == card_id).first()
        if not card:
            return {"error": "Card not found"}

        act = action.upper()
        if act not in ["ACCEPTED", "REJECTED", "MODIFIED"]:
            return {"error": "Invalid action"}

        card.status = act
        if act == "MODIFIED" and modified_pct is not None:
            card.reallocation_pct = modified_pct

        # EXECUTE ACTUAL REALLOCATION IF ACCEPTED
        if act == "ACCEPTED":
            try:
                from app.services.portfolio_service import PortfolioService
                from app.repositories.portfolio_repository import PortfolioRepository
                from app.repositories.holding_repository import HoldingRepository
                from app.repositories.asset_repository import AssetRepository
                from app.repositories.transaction_repository import TransactionRepository
                from app.schemas.transaction import TransactionCreate
                from app.models.asset import Asset
                from app.models.holding import Holding
                import uuid

                port_repo = PortfolioRepository(self.db)
                hold_repo = HoldingRepository(self.db)
                asset_repo = AssetRepository(self.db)
                tx_repo = TransactionRepository(self.db)
                port_service = PortfolioService(port_repo, hold_repo, asset_repo, tx_repo)

                # Get portfolio and total value
                portfolio_uuid = uuid.UUID(card.portfolio_id)
                u_uuid = uuid.UUID(user_id)
                port = port_repo.get_by_id(portfolio_uuid, user_id=u_uuid)
                
                if port:
                    # Calculate total portfolio value
                    total_value = 0.0
                    holdings = self.db.query(Holding).filter(Holding.portfolio_id == portfolio_uuid).all()
                    for h in holdings:
                        total_value += h.quantity * (h.average_buy_price or 1.0)
                    if total_value <= 0: total_value = 100000.0 # Fallback for empty/paper

                    realloc_value = total_value * card.reallocation_pct

                    # Get Assets
                    source_asset = self.db.query(Asset).filter(Asset.symbol == card.source_asset).first()
                    target_asset = self.db.query(Asset).filter(Asset.symbol == card.target_asset).first()

                    if source_asset and target_asset:
                        # Fetch latest prices
                        source_price = self.db.query(MarketPrice).filter(MarketPrice.asset_id == source_asset.id).order_by(MarketPrice.timestamp.desc()).first()
                        target_price = self.db.query(MarketPrice).filter(MarketPrice.asset_id == target_asset.id).order_by(MarketPrice.timestamp.desc()).first()
                        
                        s_price = source_price.close if source_price else 100.0
                        t_price = target_price.close if target_price else 100.0

                        # Cap realloc_value by the actual amount owned in source asset to prevent over-selling
                        source_holding = next((h for h in holdings if h.asset_id == source_asset.id), None)
                        max_source_val = (source_holding.quantity * s_price) if source_holding else 0.0
                        actual_realloc_value = min(realloc_value, max_source_val)

                        if actual_realloc_value > 0:
                            sell_qty = actual_realloc_value / s_price
                            buy_qty = actual_realloc_value / t_price

                            sell_success = False
                            # SELL Source
                            try:
                                port_service.record_transaction(u_uuid, TransactionCreate(
                                    portfolio_id=portfolio_uuid,
                                    asset_id=source_asset.id,
                                    transaction_type="SELL",
                                    quantity=sell_qty,
                                    price=s_price,
                                    notes=f"Automated APDE Reallocation ({card.id})"
                                ))
                                sell_success = True
                            except Exception as e:
                                logger.error(f"APDE Source SELL failed: {e}")

                            # BUY Target (only if SELL succeeds to prevent naked buying)
                            if sell_success:
                                try:
                                    port_service.record_transaction(u_uuid, TransactionCreate(
                                        portfolio_id=portfolio_uuid,
                                        asset_id=target_asset.id,
                                        transaction_type="BUY",
                                        quantity=buy_qty,
                                        price=t_price,
                                        notes=f"Automated APDE Reallocation ({card.id})"
                                    ))
                                except Exception as e:
                                    logger.error(f"APDE Target BUY failed: {e}")
            except Exception as e:
                logger.error(f"Failed to execute APDE reallocation: {e}")

        history = DecisionHistory(
            id=str(uuid.uuid4()), card_id=card.id, portfolio_id=card.portfolio_id,
            action_taken=act, recommendation_type=card.recommendation_type,
            source_asset=card.source_asset, target_asset=card.target_asset,
            reallocation_pct=card.reallocation_pct,
            predictions_used=json.dumps({"model": card.model_used}),
            confidence_score=card.confidence_score, market_regime=card.market_regime,
            portfolio_snapshot=json.dumps({"title": card.title}),
        )
        self.db.add(history)
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()

        return {
            "status": "SUCCESS", "card_id": card_id, "action_taken": act,
            "final_reallocation_pct": card.reallocation_pct,
        }
