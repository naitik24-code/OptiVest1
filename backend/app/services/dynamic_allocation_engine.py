"""
Dynamic Allocation Engine — Mathematically Derived Reallocation Step Sizes
Replaces fixed allocation percentages with continuous, risk-adjusted mathematical optimization.
"""
import math
from typing import Dict, Any

class DynamicAllocationEngine:
    """
    Computes optimal reallocation percentage dynamically using signal strength,
    Sharpe ratio, volatility penalty, and confidence scaling.
    """

    @staticmethod
    def calculate_optimal_allocation(
        confidence_score: float,
        expected_return_improvement: float,
        volatility: float,
        sharpe_ratio: float,
        risk_score: float,
        market_regime: str = "BULL",
        user_max_reallocation_pct: float = 0.25,
    ) -> Dict[str, Any]:
        """
        Dynamically calculate target move percentage:
        Percentage = f(confidence, return_delta, Sharpe_gradient, regime_factor, volatility_penalty)
        """
        # Regime Multiplier
        regime_mult = {
            "BULL": 1.20,
            "SIDEWAYS": 1.00,
            "BEAR": 0.70,
            "VOLATILE": 0.50,
        }.get(market_regime.upper(), 1.00)

        # Signal Strength (Sharpe Ratio Impact)
        sharpe_boost = max(0.1, min(2.0, sharpe_ratio / 1.5)) if sharpe_ratio > 0 else 0.5
        
        # Volatility & Risk Penalty
        vol_penalty = max(0.5, 1.0 - (volatility * 3.0))
        risk_penalty = max(0.5, 1.0 - (risk_score * 0.5))

        # Base mathematical formula for optimal capital shift %
        raw_percentage = (
            confidence_score * 0.35 +
            abs(expected_return_improvement) * 1.5 +
            sharpe_boost * 0.10
        ) * regime_mult * vol_penalty * risk_penalty

        # Bounded continuously between 2.0% (0.02) and user_max_reallocation_pct (e.g. 25.0%)
        min_pct = 0.02
        max_pct = min(0.30, user_max_reallocation_pct)
        
        recommended_pct = round(max(min_pct, min(max_pct, raw_percentage)), 4)

        return {
            "recommended_move_percentage": recommended_pct,
            "raw_calculated_percentage": round(raw_percentage, 4),
            "regime_multiplier_applied": regime_mult,
            "volatility_penalty_applied": round(vol_penalty, 4),
            "risk_penalty_applied": round(risk_penalty, 4),
            "sharpe_boost_applied": round(sharpe_boost, 4),
            "confidence_score_used": round(confidence_score, 4),
            "allocation_category": (
                "VERY_HIGH" if recommended_pct >= 0.20 else
                "HIGH" if recommended_pct >= 0.12 else
                "MEDIUM" if recommended_pct >= 0.06 else "LOW"
            )
        }
