from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.schemas.market import MarketQuoteResponse, HistoricalPriceResponse


class BaseMarketDataProvider(ABC):
    """
    Abstract Base Class defining the contract for all financial market data providers.
    Enables seamless swapping between Yahoo Finance, Alpha Vantage, Finnhub, Polygon, etc.
    """

    @abstractmethod
    def get_live_quote(self, symbol: str) -> Optional[MarketQuoteResponse]:
        """Fetch current real-time or delayed quote for a single symbol."""
        pass


    @abstractmethod
    def get_historical_prices(self, symbol: str, timeframe: str = "1M") -> Optional[HistoricalPriceResponse]:
        """Fetch historical daily OHLCV data for specified timeframe (1M, 3M, 6M, 1Y, 5Y, MAX)."""
        pass

    @abstractmethod
    def search_assets(self, query: str) -> List[Dict[str, Any]]:
        """Search global symbols by ticker, company name, or keyword."""
        pass
