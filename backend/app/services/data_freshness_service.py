from datetime import datetime, timezone
from typing import Dict, Any


class DataFreshnessService:
    """
    Engine 3: Data Freshness Engine.
    Evaluates dataset age, computes freshness scores, and categorizes status
    into FRESH (<5 min), STALE (5-60 min), and EXPIRED (>60 min).
    """

    FRESH_THRESHOLD_SECONDS = 300       # 5 minutes
    STALE_THRESHOLD_SECONDS = 3600      # 1 hour

    @staticmethod
    def evaluate_freshness(last_updated: datetime) -> Dict[str, Any]:
        """Calculates data age, freshness status (FRESH/STALE/EXPIRED), and freshness score."""
        now = datetime.now(timezone.utc)
        if last_updated.tzinfo is None:
            last_updated = last_updated.replace(tzinfo=timezone.utc)

        age_seconds = max(0.0, (now - last_updated).total_seconds())

        if age_seconds <= DataFreshnessService.FRESH_THRESHOLD_SECONDS:
            status = "FRESH"
            score = 100.0
        elif age_seconds <= DataFreshnessService.STALE_THRESHOLD_SECONDS:
            status = "STALE"
            # Linearly decay score from 100 to 50
            decay = ((age_seconds - DataFreshnessService.FRESH_THRESHOLD_SECONDS) / (DataFreshnessService.STALE_THRESHOLD_SECONDS - DataFreshnessService.FRESH_THRESHOLD_SECONDS)) * 50.0
            score = max(50.0, 100.0 - decay)
        else:
            status = "EXPIRED"
            score = max(0.0, 50.0 - ((age_seconds - DataFreshnessService.STALE_THRESHOLD_SECONDS) / 86400.0) * 50.0)

        return {
            "last_updated": last_updated.isoformat(),
            "data_age_seconds": round(age_seconds, 1),
            "status": status,
            "freshness_score": round(score, 1),
            "requires_refresh": status in ("STALE", "EXPIRED")
        }
