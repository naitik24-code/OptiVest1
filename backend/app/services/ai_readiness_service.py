from typing import Dict, Any, List
from datetime import datetime, timezone


class AIReadinessValidationService:
    """
    Engine 10: AI Readiness Validation Engine.
    Automates pre-flight validation on market datasets to guarantee high-quality,
    continuous time-series feature inputs before feeding Phase 5 AI prediction models.
    """

    @staticmethod
    def validate_dataset_readiness(
        symbol: str,
        total_bars: int,
        feature_count: int,
        data_quality_score: float,
        data_freshness_status: str
    ) -> Dict[str, Any]:
        """Generates an AI Readiness Report for a given asset dataset."""
        checks = []
        is_ready = True

        # Check 1: Minimum Historical Length (at least 20 daily bars for SMA 20 / RSI 14)
        if total_bars >= 20:
            checks.append({"check": "MINIMUM_HISTORY_LENGTH", "passed": True, "detail": f"Found {total_bars} daily bars (Min required: 20)"})
        else:
            checks.append({"check": "MINIMUM_HISTORY_LENGTH", "passed": False, "detail": f"Insufficient bars ({total_bars} < 20)"})
            is_ready = False

        # Check 2: Feature Engineering Completeness
        if feature_count >= 15:
            checks.append({"check": "FEATURE_VECTOR_COMPLETENESS", "passed": True, "detail": f"{feature_count} technical features calculated"})
        else:
            checks.append({"check": "FEATURE_VECTOR_COMPLETENESS", "passed": False, "detail": f"Sparse feature vector ({feature_count} < 15)"})
            is_ready = False

        # Check 3: Data Quality Score Threshold
        if data_quality_score >= 80.0:
            checks.append({"check": "DATA_QUALITY_SCORE", "passed": True, "detail": f"Quality score: {data_quality_score}%"})
        else:
            checks.append({"check": "DATA_QUALITY_SCORE", "passed": False, "detail": f"Low quality score: {data_quality_score}% (< 80%)"})
            is_ready = False

        # Check 4: Data Freshness Status
        if data_freshness_status in ("FRESH", "STALE"):
            checks.append({"check": "DATA_FRESHNESS", "passed": True, "detail": f"Freshness state: {data_freshness_status}"})
        else:
            checks.append({"check": "DATA_FRESHNESS", "passed": False, "detail": f"Expired dataset ({data_freshness_status})"})
            is_ready = False

        readiness_score = round(sum(1 for c in checks if c["passed"]) / len(checks) * 100.0, 1)

        return {
            "symbol": symbol.upper(),
            "ai_ready": is_ready,
            "readiness_score_pct": readiness_score,
            "validation_timestamp": datetime.now(timezone.utc).isoformat(),
            "checks": checks,
            "target_models_ready": ["LSTM_PRICE_PREDICTOR", "XGBOOST_VOLATILITY_FORECASTER", "APDE_RISK_SCORER"] if is_ready else []
        }
