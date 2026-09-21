import logging
from typing import List, Dict, Any, Tuple
from datetime import datetime
from app.schemas.market import MarketQuoteResponse, HistoricalPricePoint

logger = logging.getLogger("optivest.data_quality")


class DataValidationService:
    """
    Engine 1: Data Quality Engine.
    Enforces production validation pipelines across live market quotes & historical OHLCV data.
    Reject invalid records, compute quality score, and generate diagnostic reports.
    """

    @staticmethod
    def validate_quote(quote: MarketQuoteResponse) -> Tuple[bool, float, List[str]]:
        """
        Validates real-time quote integrity.
        Returns: (is_valid, quality_score, anomalies)
        """
        anomalies = []
        score = 100.0

        if quote.price <= 0:
            anomalies.append(f"Invalid non-positive price: {quote.price}")
            score -= 50.0

        if quote.open_price < 0 or quote.day_high < 0 or quote.day_low < 0:
            anomalies.append("Negative OHLC price value detected")
            score -= 30.0

        if quote.day_high > 0 and quote.day_low > 0:
            if quote.day_high < quote.price or quote.day_high < quote.open_price:
                anomalies.append(f"Day High ({quote.day_high}) is below price/open")
                score -= 20.0
            if quote.day_low > quote.price or quote.day_low > quote.open_price:
                anomalies.append(f"Day Low ({quote.day_low}) is above price/open")
                score -= 20.0

        if quote.volume < 0:
            anomalies.append(f"Negative volume: {quote.volume}")
            score -= 25.0

        if quote.pe_ratio and quote.pe_ratio < 0:
            anomalies.append(f"Negative PE ratio: {quote.pe_ratio}")
            score -= 10.0

        is_valid = score >= 60.0
        return is_valid, max(0.0, score), anomalies


