import uuid
import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.portfolio import Portfolio
from app.models.holding import Holding
from app.models.user_preference import UserPreference
from app.models.market_price import MarketPrice
from app.services.prediction_engine import PredictionEngine

logger = logging.getLogger("optivest.candidate_engine")

class CandidateDiscoveryEngine:
    """Phase 18 — Candidate Discovery Engine (CDE)"""

    def __init__(self, db: Session):
        self.db = db
        self.prediction_engine = PredictionEngine(db)

    def _get_historical_returns(self, symbols: List[str], lookback_days: int = 120) -> pd.DataFrame:
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

    def _filter_eligible_assets(self, current_holdings: List[str]) -> List[Asset]:
        """Hard eligibility checks."""
        # A. Asset exists and is active
        # Only select a subset (e.g. Tier 1 SP500) to ensure performance
        eligible_assets = self.db.query(Asset).filter(
            Asset.is_active == True,
            Asset.tier == "TIER_1_SP500"
        ).all()

        if not eligible_assets:
            eligible_assets = self.db.query(Asset).filter(
                Asset.is_active == True
            ).limit(50).all()

        # F. Candidate is not the exact same holding
        candidates = [a for a in eligible_assets if a.symbol not in current_holdings]
        return candidates

    def discover_candidates(self, portfolio_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Discover and rank candidate assets for a portfolio."""
        try:
            p_uuid = uuid.UUID(portfolio_id)
        except:
            p_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(portfolio_id))
            
        port = self.db.query(Portfolio).filter(Portfolio.id == p_uuid).first()
        if not port:
            return []

        user_id = port.user_id
        pref = self.db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        risk_level = pref.risk_tolerance_level if pref else 3

        holdings = self.db.query(Holding).filter(Holding.portfolio_id == p_uuid).all()
        current_symbols = [h.asset.symbol for h in holdings if h.asset]
        
        # 1. Eligibility Filtering
        raw_candidates = self._filter_eligible_assets(current_symbols)
        if not raw_candidates:
            return []

        cand_symbols = [c.symbol for c in raw_candidates]
        
        # 2. Fetch Historical Returns for correlation
        all_symbols = current_symbols + cand_symbols
        returns_df = self._get_historical_returns(all_symbols)
        
        if returns_df.empty:
            logger.warning(f"No historical returns found for candidate pool.")
            return []
            
        valid_symbols = [s for s in cand_symbols if s in returns_df.columns]
        port_returns_df = returns_df[[s for s in current_symbols if s in returns_df.columns]] if current_symbols else None
        
        if port_returns_df is not None and not port_returns_df.empty:
            port_series = port_returns_df.mean(axis=1) # simplified equal weight portfolio return for correlation
        else:
            port_series = None

        scored_candidates = []

        # 3. Predict & Score
        for sym in valid_symbols:
            asset_obj = next((a for a in raw_candidates if a.symbol == sym), None)
            
            # C. Sufficient historical data
            asset_returns = returns_df[sym]
            if len(asset_returns) < 30:
                continue
                
            # E. Prediction Data
            pred = self.prediction_engine.generate_prediction(sym, prediction_horizon="5D", save_to_db=False)
            if "error" in pred:
                continue
                
            exp_ret = pred.get("predicted_return", 0.0)
            conf = pred.get("confidence_score", 0.5)
            
            # Volatility
            vol = float(asset_returns.std() * np.sqrt(252))
            
            # Diversification benefit (negative correlation is better)
            corr = 0.0
            if port_series is not None:
                corr = asset_returns.corr(port_series)
                if np.isnan(corr): corr = 0.0

            # Scoring Logic
            # Higher expected return is good. Lower volatility is good (depending on risk_level).
            # Lower correlation is good for diversification.
            # Base score = return (annualized roughly)
            ann_ret = exp_ret * 50.4 # (252/5)
            
            # Penalize risk based on risk tolerance (1=conservative, 5=aggressive)
            risk_penalty = vol * (6 - risk_level) * 0.5
            
            # Reward low correlation
            div_benefit = (1.0 - corr) * 0.2
            
            score = (ann_ret - risk_penalty + div_benefit) * conf
            
            reasons = []
            if ann_ret > 0.15: reasons.append(f"Strong expected return ({ann_ret*100:.1f}%)")
            if vol < 0.20: reasons.append(f"Low historical volatility ({vol*100:.1f}%)")
            if corr < 0.3 and current_symbols: reasons.append(f"Strong diversification benefit (corr: {corr:.2f})")
            
            why_not = []
            if vol > 0.40 and risk_level < 4: why_not.append(f"High volatility ({vol*100:.1f}%) violates conservative constraints")
            if corr > 0.8 and current_symbols: why_not.append("High correlation with current portfolio")

            # Hard constraint check: filter out if too risky for conservative
            if vol > 0.40 and risk_level < 3:
                continue

            scored_candidates.append({
                "asset_id": str(asset_obj.id) if asset_obj else "",
                "ticker": sym,
                "name": asset_obj.company_name if asset_obj else sym,
                "candidate_type": "NEW_ALLOCATION" if not current_symbols else "REPLACEMENT",
                "rank": 0,
                "score": float(score),
                "expected_return": float(ann_ret),
                "risk_metrics": {"volatility": float(vol), "correlation_to_portfolio": float(corr)},
                "diversification_metrics": {"correlation": float(corr)},
                "reasons": reasons,
                "warnings": why_not,
                "data_quality": {
                    "price_data": "AVAILABLE",
                    "historical_data": "AVAILABLE",
                    "prediction": "AVAILABLE",
                    "fundamentals": "NOT_AVAILABLE",
                    "valuation": "NOT_AVAILABLE",
                    "sentiment": "NOT_AVAILABLE",
                },
                "source_signals": {"model_confidence": float(conf)}
            })

        # 4. Rank
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        
        # Assign rank
        for i, cand in enumerate(scored_candidates):
            cand["rank"] = i + 1

        return scored_candidates[:limit]
