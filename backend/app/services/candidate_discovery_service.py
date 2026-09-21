"""
Phase 18 — Candidate Discovery Engine (CDE)
"""
import logging
import uuid
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.market_price import MarketPrice
from app.models.holding import Holding
from app.models.portfolio import Portfolio
from app.models.user_preference import UserPreference
from app.services.prediction_engine import PredictionEngine
from app.services.apde_engine import APDEEngine
from app.services.fundamental_engine import FundamentalEngine

logger = logging.getLogger("optivest.cde")

class CandidateDiscoveryService:
    def __init__(self, db: Session):
        self.db = db
        self.apde_engine = APDEEngine(db)
        self.prediction_engine = PredictionEngine(db)
        self.fundamental_engine = FundamentalEngine(db)

    def _get_eligible_universe(self) -> List[Asset]:
        # Rule: Asset exists, is active
        return self.db.query(Asset).filter(Asset.is_active == True).all()
        
    def _check_hard_eligibility(self, asset: Asset, horizon_days: int) -> Dict[str, Any]:
        status = {
            "eligible": False,
            "reason": "",
            "price_data": "unavailable",
            "historical_data": "unavailable",
            "prediction": "unavailable",
            "fundamentals": "UNAVAILABLE",
            "valuation": "UNAVAILABLE",    # Phase 20
            "sentiment": "UNAVAILABLE"     # Phase 21
        }
        
        # Check price data & history
        lookback = datetime.now() - timedelta(days=90)
        prices_count = self.db.query(MarketPrice.id).filter(
            MarketPrice.symbol == asset.symbol,
            MarketPrice.timestamp >= lookback
        ).count()
        
        if prices_count < 10: # Need at least 10 days of data for some minimal history
            status["reason"] = f"Insufficient historical data ({prices_count} days)"
            return status
            
        status["price_data"] = "available"
        status["historical_data"] = "available"
        
        status["eligible"] = True
        status["reason"] = "Passed hard constraints"
        return status
        
    def discover_candidates(
        self, portfolio_id: str, candidate_type: str = "NEW_ALLOCATION", 
        target_holding: Optional[str] = None, top_n: int = 5
    ) -> List[Dict[str, Any]]:
        # Validate portfolio
        try:
            p_uuid = uuid.UUID(portfolio_id)
        except ValueError:
            p_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(portfolio_id))
            
        portfolio = self.db.query(Portfolio).filter(Portfolio.id == p_uuid).first()
        if not portfolio:
            logger.warning(f"Portfolio {portfolio_id} not found for candidate discovery.")
            return []
            
        # Get portfolio health / existing allocations
        health = self.apde_engine.calculate_portfolio_health(portfolio_id)
        allocations = health.get("asset_allocations", {})
        existing_symbols = list(allocations.keys())
        
        user_pref = self.db.query(UserPreference).filter(UserPreference.user_id == portfolio.user_id).first()
        risk_level = user_pref.risk_tolerance_level if user_pref else 3 # 1-5
        
        universe = self._get_eligible_universe()
        
        # Batch load fundamentals for universe to eliminate N+1 queries
        asset_map = {asset.id: asset.symbol for asset in universe}
        fundamentals_map = self.fundamental_engine.get_batch_fundamentals(asset_map)

        candidates = []
        for asset in universe:
            # Skip existing holdings if it's NEW_ALLOCATION or the target itself
            if candidate_type == "NEW_ALLOCATION" and asset.symbol in existing_symbols:
                continue
            if candidate_type == "REPLACEMENT" and asset.symbol == target_holding:
                continue
            if candidate_type == "REPLACEMENT" and target_holding and target_holding not in existing_symbols:
                 pass
                 
            if asset.symbol in existing_symbols:
                continue
                
            eligibility = self._check_hard_eligibility(asset, 30)
            if not eligibility["eligible"]:
                continue
                
            # 1. Expected Return (ML)
            prediction = self.prediction_engine.generate_prediction(asset.symbol, "5D", save_to_db=False)
            if "error" in prediction:
                eligibility["prediction"] = "unavailable"
                exp_return = 0.0
            else:
                eligibility["prediction"] = "available"
                # annualized
                exp_return = prediction["predicted_return"] * (252 / 5)
                
            # 2. Fundamental Intelligence Integration (Phase 19)
            fund_periods = fundamentals_map.get(asset.id, [])
            fund_assessment = self.fundamental_engine.evaluate_quality(fund_periods)
            eligibility["fundamentals"] = fund_assessment["status"]
                
            # 3. Risk (Historical Volatility)
            hist_ret = self.apde_engine._get_historical_returns([asset.symbol], 90)
            vol = 0.0
            momentum = 0.0
            if not hist_ret.empty and asset.symbol in hist_ret.columns:
                vol = float(hist_ret[asset.symbol].std() * np.sqrt(252))
                cum_ret = (1 + hist_ret[asset.symbol]).prod() - 1
                momentum = float(cum_ret)
                
            # 4. Diversification Benefit (Correlation with Portfolio)
            div_benefit = 0.0
            if existing_symbols and not hist_ret.empty:
                full_hist = self.apde_engine._get_historical_returns(existing_symbols + [asset.symbol], 90)
                if not full_hist.empty and asset.symbol in full_hist.columns:
                    # Only use symbols that are actually present in the fetched history
                    available_existing = [s for s in existing_symbols if s in full_hist.columns]
                    w = np.array([allocations.get(s, 0.0) for s in available_existing])
                    if len(w) > 0 and w.sum() > 0:
                        w = w / w.sum()
                        port_returns = full_hist[available_existing].dot(w)
                        if len(port_returns) == len(full_hist[asset.symbol]):
                            corr = port_returns.corr(full_hist[asset.symbol])
                            if not np.isnan(corr):
                                div_benefit = 1.0 - corr

            # 5. Dynamic Factor Score Calculation
            raw_w_ret = 0.25 + (risk_level - 3) * 0.1
            raw_w_vol = 0.25 - (risk_level - 3) * 0.1
            raw_w_div = 0.20 + (3 - risk_level) * 0.05
            raw_w_mom = 0.15 + (risk_level - 3) * 0.05
            raw_w_fund = 0.15
            
            # Normalize signals into [0, 1]
            n_ret = max(0.0, min(exp_return / 0.5, 1.0))
            n_vol = max(0.0, min(1.0 - (vol / 0.5), 1.0))
            n_div = max(0.0, min(div_benefit / 2.0, 1.0))
            n_mom = max(0.0, min((momentum + 0.2) / 0.4, 1.0))
            
            active_factors = [
                ("ret", raw_w_ret, n_ret),
                ("vol", raw_w_vol, n_vol),
                ("div", raw_w_div, n_div),
                ("mom", raw_w_mom, n_mom),
            ]
            
            has_valid_fundamentals = (
                fund_assessment["status"] in ["AVAILABLE", "PARTIALLY_AVAILABLE"]
                and fund_assessment["quality"] != "INSUFFICIENT_DATA"
            )
            if has_valid_fundamentals:
                n_fund = fund_assessment["score"] / 100.0
                active_factors.append(("fund", raw_w_fund, n_fund))
            
            total_active_w = sum(w for _, w, _ in active_factors)
            total_score = sum((w / total_active_w) * val for _, w, val in active_factors) * 100.0 if total_active_w > 0 else 0.0
            
            # Explanations
            why_considered = []
            if n_ret > 0.6: why_considered.append("High expected return prediction.")
            if n_vol > 0.6: why_considered.append("Favorable low-volatility profile.")
            if n_div > 0.6: why_considered.append("Provides strong diversification benefit.")
            if n_mom > 0.6: why_considered.append("Positive short-term momentum.")
            
            if has_valid_fundamentals:
                if fund_assessment["quality"] == "STRONG":
                    why_considered.append(f"Strong fundamental quality ({fund_assessment['score']}/100).")
                elif fund_assessment["quality"] == "MODERATE":
                    why_considered.append(f"Healthy financial profile ({fund_assessment['score']}/100).")
                why_considered.extend(fund_assessment["reasons"])
            
            if not why_considered:
                why_considered.append("Acceptable overall balanced profile.")
                
            warnings = []
            if eligibility["prediction"] == "unavailable": warnings.append("ML Prediction unavailable.")
            if vol > 0.4: warnings.append("High historical volatility.")
            if has_valid_fundamentals:
                warnings.extend(fund_assessment["warnings"])
            else:
                warnings.append("Fundamental statement data unavailable.")
            
            candidate = {
                "asset_id": str(asset.id),
                "ticker": asset.symbol,
                "name": asset.company_name,
                "candidate_type": candidate_type,
                "eligibility": eligibility,
                "score": round(total_score, 1),
                "expected_return": round(exp_return, 4),
                "risk_metrics": {
                    "volatility": round(vol, 4),
                    "momentum": round(momentum, 4)
                },
                "diversification_metrics": {
                    "benefit_score": round(div_benefit, 4)
                },
                "fundamental_metrics": fund_assessment["metrics"] if has_valid_fundamentals else {},
                "fundamental_quality": fund_assessment["quality"],
                "fundamental_score": fund_assessment["score"] if has_valid_fundamentals else None,
                "fundamental_status": fund_assessment["status"],
                "reasons": why_considered,
                "warnings": warnings,
                "data_quality": eligibility,
                "source_signals": {
                    "w_ret": round(raw_w_ret / total_active_w, 2),
                    "w_vol": round(raw_w_vol / total_active_w, 2), 
                    "w_div": round(raw_w_div / total_active_w, 2),
                    "w_mom": round(raw_w_mom / total_active_w, 2),
                    "w_fund": round(raw_w_fund / total_active_w, 2) if has_valid_fundamentals else 0.0
                }
            }
            candidates.append(candidate)
            
        # Rank candidates
        candidates.sort(key=lambda x: x["score"], reverse=True)
        
        # Assign rank
        for i, c in enumerate(candidates):
            c["rank"] = i + 1
            
        return candidates[:top_n]
