from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone


class BaseForexProvider(ABC):
    """
    Abstract Base Class defining contract for Forex Exchange Rate Providers.
    Decouples implementation from specific FX providers (ExchangeRate-API, ECB, OpenExchangeRates, CurrencyAPI).
    """

    @abstractmethod
    def get_name(self) -> str:
        """Return provider identifier name."""
        pass

    @abstractmethod
    def get_exchange_rates(self, base_currency: str = "USD") -> Dict[str, float]:
        """Fetch relative exchange rates against base currency."""
        pass

    @abstractmethod
    def convert_currency(self, amount: float, from_currency: str, to_currency: str) -> Dict[str, Any]:
        """Convert monetary value between any supported currency pair."""
        pass


class MockExchangeRateAPIProvider(BaseForexProvider):
    """Forex Provider Implementation for ExchangeRate-API."""

    def get_name(self) -> str:
        return "ExchangeRate-API"

    def get_exchange_rates(self, base_currency: str = "USD") -> Dict[str, float]:
        # Reference FX rates against USD
        base_rates = {
            "USD": 1.0,
            "INR": 83.50,
            "EUR": 0.92,
            "GBP": 0.78,
            "JPY": 155.20,
            "AUD": 1.52,
            "CAD": 1.36,
            "CHF": 0.90,
            "SGD": 1.35,
            "HKD": 7.81,
        }
        if base_currency == "USD":
            return base_rates
        
        base_rate = base_rates.get(base_currency, 1.0)
        return {code: rate / base_rate for code, rate in base_rates.items()}

    def convert_currency(self, amount: float, from_currency: str, to_currency: str) -> Dict[str, Any]:
        rates = self.get_exchange_rates("USD")
        from_rate = rates.get(from_currency.upper(), 1.0)
        to_rate = rates.get(to_currency.upper(), 1.0)
        
        converted = (amount / from_rate) * to_rate
        return {
            "provider": self.get_name(),
            "from": from_currency.upper(),
            "to": to_currency.upper(),
            "amount": amount,
            "converted_amount": round(converted, 4),
            "rate": round(to_rate / from_rate, 6),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


class MockECBProvider(BaseForexProvider):
    """Forex Provider Implementation for European Central Bank (ECB)."""

    def get_name(self) -> str:
        return "European Central Bank (ECB)"

    def get_exchange_rates(self, base_currency: str = "USD") -> Dict[str, float]:
        rates = MockExchangeRateAPIProvider().get_exchange_rates(base_currency)
        return rates

    def convert_currency(self, amount: float, from_currency: str, to_currency: str) -> Dict[str, Any]:
        res = MockExchangeRateAPIProvider().convert_currency(amount, from_currency, to_currency)
        res["provider"] = self.get_name()
        return res


class MockOpenExchangeRatesProvider(BaseForexProvider):
    """Forex Provider Implementation for Open Exchange Rates API."""

    def get_name(self) -> str:
        return "Open Exchange Rates"

    def get_exchange_rates(self, base_currency: str = "USD") -> Dict[str, float]:
        return MockExchangeRateAPIProvider().get_exchange_rates(base_currency)

    def convert_currency(self, amount: float, from_currency: str, to_currency: str) -> Dict[str, Any]:
        res = MockExchangeRateAPIProvider().convert_currency(amount, from_currency, to_currency)
        res["provider"] = self.get_name()
        return res


class MockCurrencyAPIProvider(BaseForexProvider):
    """Forex Provider Implementation for CurrencyAPI."""

    def get_name(self) -> str:
        return "CurrencyAPI"

    def get_exchange_rates(self, base_currency: str = "USD") -> Dict[str, float]:
        return MockExchangeRateAPIProvider().get_exchange_rates(base_currency)

    def convert_currency(self, amount: float, from_currency: str, to_currency: str) -> Dict[str, Any]:
        res = MockExchangeRateAPIProvider().convert_currency(amount, from_currency, to_currency)
        res["provider"] = self.get_name()
        return res


class ForexProviderFactory:
    """Factory for selecting and instantiating Forex data providers dynamically."""

    _providers: Dict[str, BaseForexProvider] = {
        "exchangerate_api": MockExchangeRateAPIProvider(),
        "ecb": MockECBProvider(),
        "open_exchange_rates": MockOpenExchangeRatesProvider(),
        "currency_api": MockCurrencyAPIProvider(),
    }

    @classmethod
    def get_provider(cls, name: str = "exchangerate_api") -> BaseForexProvider:
        provider_key = name.lower().strip()
        if provider_key not in cls._providers:
            return cls._providers["exchangerate_api"]
        return cls._providers[provider_key]

    @classmethod
    def list_available_providers(cls) -> List[str]:
        return [p.get_name() for p in cls._providers.values()]
