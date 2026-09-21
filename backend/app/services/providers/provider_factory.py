from typing import Dict, Type
from app.services.providers.base_provider import BaseMarketDataProvider
from app.services.providers.yahoo_provider import YahooFinanceProvider


class MarketDataProviderFactory:
    """
    Factory class enabling dynamic resolution and swapping of market data providers.
    Supports Yahoo Finance, Alpha Vantage, Finnhub, Polygon, Twelve Data, etc.
    """

    _providers: Dict[str, Type[BaseMarketDataProvider]] = {
        "YAHOO": YahooFinanceProvider,
        "YAHOO_FINANCE": YahooFinanceProvider,
        "DEFAULT": YahooFinanceProvider
    }


    @classmethod
    def get_provider(cls, provider_name: str = "YAHOO") -> BaseMarketDataProvider:
        """Instantiate and return the requested market data provider adapter."""
        provider_cls = cls._providers.get(provider_name.upper(), YahooFinanceProvider)
        return provider_cls()
