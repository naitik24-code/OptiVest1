"""
Module 15 — Market Regime Detection Engine
Detects market regimes: BULL_MARKET, BEAR_MARKET, SIDEWAYS_MARKET, HIGH_VOLATILITY, LOW_VOLATILITY, RECOVERY_PHASE, CORRECTION_PHASE.
Attaches detected regime to predictions to prepare for future adaptive model selection.
"""
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, List


class MarketRegimeDetector:
    """Engine for analyzing time-series indicators to classify market regimes."""


    def detect_regime(self, asset_symbol: str, price_series: List[float] = None, db = None) -> Dict[str, Any]:
        """Classify current market regime using trend, momentum, and volatility indicators."""
        if not price_series or len(price_series) < 20:
            if db is None:
                from app.db.session import SessionLocal
                session = SessionLocal()
                should_close = True
            else:
                session = db
                should_close = False

            try:
                from app.models.market_price import MarketPrice
                records = session.query(MarketPrice.close).filter(
                    MarketPrice.symbol == asset_symbol
                ).order_by(MarketPrice.timestamp.desc()).limit(60).all()
                if records and len(records) >= 5:
                    prices = np.array([r[0] for r in reversed(records)], dtype=float)
                else:
                    raise ValueError(f"Insufficient historical data for {asset_symbol} to determine regime.")
            finally:
                if should_close:
                    session.close()
        else:
            prices = np.array(price_series, dtype=float)

        n = len(prices)
        returns = np.diff(prices) / prices[:-1]
        ann_vol = float(np.std(returns) * np.sqrt(252))
        total_return = float((prices[-1] - prices[0]) / prices[0])

        sma_20 = float(np.mean(prices[-20:]))
        sma_50 = float(np.mean(prices[-min(50, n):]))
        last_price = float(prices[-1])

        sma_ratio = last_price / sma_20 if sma_20 > 0 else 1.0
        trend_slope = float((prices[-1] - prices[-10]) / prices[-10]) if n >= 10 else 0.0

        # Regime decision logic
        if ann_vol > 0.28:
            primary_regime = "HIGH_VOLATILITY"
        elif ann_vol < 0.12:
            primary_regime = "LOW_VOLATILITY"
        elif total_return > 0.08 and last_price >= sma_20:
            primary_regime = "BULL_MARKET"
        elif total_return < -0.08 and last_price < sma_20:
            primary_regime = "BEAR_MARKET"
        elif trend_slope > 0.03 and total_return < 0:
            primary_regime = "RECOVERY_PHASE"
        elif trend_slope < -0.03 and total_return > 0:
            primary_regime = "CORRECTION_PHASE"
        else:
            primary_regime = "SIDEWAYS_MARKET"

        # Confidence calculation
        confidence = float(np.clip(0.65 + abs(trend_slope) * 2 + (0.1 if ann_vol < 0.2 else 0), 0.55, 0.95))

        return {
            "asset_symbol": asset_symbol,
            "regime": primary_regime,
            "regime_confidence": round(confidence, 4),
            "volatility_annualized": round(ann_vol, 4),
            "total_return_pct": round(total_return, 4),
            "trend_slope": round(trend_slope, 4),
            "sma_20_ratio": round(sma_ratio, 4),
            "last_price": round(last_price, 2),
            "detected_at": datetime.now(timezone.utc).isoformat(),
            "recommended_algorithms": self._get_recommended_algos(primary_regime),
        }

    def _get_recommended_algos(self, regime: str) -> List[str]:
        if regime in ["BULL_MARKET", "RECOVERY_PHASE"]:
            return ["LSTM", "XGBOOST", "GRU"]
        elif regime in ["BEAR_MARKET", "CORRECTION_PHASE"]:
            return ["LIGHTGBM", "EXTRA_TREES", "LSTM"]
        elif regime in ["HIGH_VOLATILITY"]:
            return ["EXTRA_TREES", "RANDOM_FOREST", "GRU"]
        else:  # SIDEWAYS_MARKET / LOW_VOLATILITY
            return ["LINEAR_REGRESSION", "RANDOM_FOREST", "LIGHTGBM"]


market_regime_detector = MarketRegimeDetector()
