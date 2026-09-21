"""
Module 7 — Confidence Engine
Every prediction must contain: Expected Return, Confidence Score, Risk Score,
Prediction Horizon, Probability (UP/DOWN), Model Version, Dataset Version,
Feature Version, Prediction Timestamp.
"""
from __future__ import annotations
import random
import math
from typing import Dict, Any, Optional
from datetime import datetime


HORIZON_RISK_MULTIPLIER = {
    "1D":  0.80, "5D": 1.00, "10D": 1.15, "20D": 1.30, "30D": 1.45
}

REASON_CODES = {
    "STRONG_BULLISH":  "Strong upward momentum with high model consensus",
    "MODERATE_BULLISH":"Moderate upward signal with acceptable confidence",
    "WEAK_BULLISH":    "Weak upward signal; caution advised",
    "NEUTRAL":         "No clear directional signal",
    "WEAK_BEARISH":    "Weak downward signal; caution advised",
    "MODERATE_BEARISH":"Moderate downward signal with acceptable confidence",
    "STRONG_BEARISH":  "Strong downward momentum with high model consensus",
    "LOW_CONFIDENCE":  "Model confidence below threshold — prediction unreliable",
}


class ConfidenceEngine:
    """
    Module 7 — Confidence Engine.
    Attaches full confidence, risk, and probability metadata to every prediction.
    """

    CONFIDENCE_THRESHOLD: float = 0.60   # Minimum to consider prediction actionable

    @staticmethod
    def compute_confidence(
        raw_predicted_return: float,
        model_agreement: float = 1.0,
        directional_accuracy: float = 0.60,
        volatility_estimate: float = 0.015,
        prediction_horizon: str = "5D",
        empirical_accuracy_adjustment: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Compute confidence score from model signals calibrated by empirical learning feedback.

        confidence = f(directional_accuracy, model_agreement, volatility_penalty, empirical_adjustment)
        risk_score = f(volatility, horizon, confidence)
        """
        horizon_mult = HORIZON_RISK_MULTIPLIER.get(prediction_horizon, 1.0)
        volatility_penalty = min(0.20, volatility_estimate * 5.0)

        # Base confidence from directional accuracy + agreement + empirical feedback adjustment
        base_confidence = (directional_accuracy * 0.60) + (model_agreement * 0.40) + empirical_accuracy_adjustment
        confidence_score = round(max(0.0, min(1.0, base_confidence - volatility_penalty)), 4)

        # Risk score: higher volatility × horizon = higher risk
        risk_score = round(min(1.0, volatility_estimate * 30 * horizon_mult), 4)

        # Probabilities (UP and DOWN must sum to 1)
        prob_up = round(max(0.1, min(0.9, 0.5 + raw_predicted_return * 10)), 4)
        prob_down = round(1.0 - prob_up, 4)

        # Reason code
        direction = "UP" if raw_predicted_return >= 0 else "DOWN"
        if confidence_score < ConfidenceEngine.CONFIDENCE_THRESHOLD:
            reason_key = "LOW_CONFIDENCE"
        elif raw_predicted_return > 0.03 and confidence_score > 0.70:
            reason_key = "STRONG_BULLISH"
        elif raw_predicted_return > 0.01 and confidence_score > 0.60:
            reason_key = "MODERATE_BULLISH"
        elif raw_predicted_return > 0:
            reason_key = "WEAK_BULLISH"
        elif raw_predicted_return < -0.03 and confidence_score > 0.70:
            reason_key = "STRONG_BEARISH"
        elif raw_predicted_return < -0.01 and confidence_score > 0.60:
            reason_key = "MODERATE_BEARISH"
        elif raw_predicted_return < 0:
            reason_key = "WEAK_BEARISH"
        else:
            reason_key = "NEUTRAL"

        return {
            "confidence_score": confidence_score,
            "risk_score": risk_score,
            "probability_up": prob_up,
            "probability_down": prob_down,
            "predicted_direction": direction,
            "reason_code": reason_key,
            "reason_description": REASON_CODES[reason_key],
            "is_actionable": confidence_score >= ConfidenceEngine.CONFIDENCE_THRESHOLD,
            "horizon_risk_multiplier": horizon_mult,
            "volatility_penalty_applied": volatility_penalty,
        }


