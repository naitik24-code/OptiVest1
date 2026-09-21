from typing import Dict, Any, List


class CurrencyService:
    """
    Module 4 & 5: Enterprise Global Currency & Forex Data Engine.
    Base currency is USD. Provides exchange rates and conversion functions
    across major global currencies (USD, INR, EUR, GBP, JPY, AUD, CAD, CHF, SGD, HKD).
    """

    SUPPORTED_CURRENCIES = {
        "USD": {"name": "US Dollar", "symbol": "$", "rate_vs_usd": 1.0},
        "INR": {"name": "Indian Rupee", "symbol": "₹", "rate_vs_usd": 83.50},
        "EUR": {"name": "Euro", "symbol": "€", "rate_vs_usd": 0.92},
        "GBP": {"name": "British Pound", "symbol": "£", "rate_vs_usd": 0.78},
        "JPY": {"name": "Japanese Yen", "symbol": "¥", "rate_vs_usd": 155.20},
        "AUD": {"name": "Australian Dollar", "symbol": "A$", "rate_vs_usd": 1.52},
        "CAD": {"name": "Canadian Dollar", "symbol": "C$", "rate_vs_usd": 1.36},
        "CHF": {"name": "Swiss Franc", "symbol": "CHF", "rate_vs_usd": 0.90},
        "SGD": {"name": "Singapore Dollar", "symbol": "S$", "rate_vs_usd": 1.35},
        "HKD": {"name": "Hong Kong Dollar", "symbol": "HK$", "rate_vs_usd": 7.81},
    }

    @staticmethod
    def get_supported_currencies() -> List[Dict[str, Any]]:
        """Returns list of supported currencies and their FX metadata."""
        return [
            {
                "code": code,
                "name": info["name"],
                "symbol": info["symbol"],
                "rate_vs_usd": info["rate_vs_usd"]
            }
            for code, info in CurrencyService.SUPPORTED_CURRENCIES.items()
        ]

    @staticmethod
    def convert_amount(amount: float, from_currency: str = "USD", to_currency: str = "USD") -> Dict[str, Any]:
        """Converts financial values from one currency to target display currency."""
        from_code = from_currency.upper().strip()
        to_code = to_currency.upper().strip()

        from_rate = CurrencyService.SUPPORTED_CURRENCIES.get(from_code, {}).get("rate_vs_usd", 1.0)
        to_rate = CurrencyService.SUPPORTED_CURRENCIES.get(to_code, {}).get("rate_vs_usd", 1.0)

        # First convert to USD base, then to target currency
        amount_usd = amount / from_rate if from_rate > 0 else amount
        converted_amount = amount_usd * to_rate

        to_symbol = CurrencyService.SUPPORTED_CURRENCIES.get(to_code, {}).get("symbol", "$")

        return {
            "original_amount": amount,
            "from_currency": from_code,
            "to_currency": to_code,
            "exchange_rate": round(to_rate / from_rate, 6) if from_rate > 0 else 1.0,
            "converted_amount": round(converted_amount, 2),
            "formatted_string": f"{to_symbol}{converted_amount:,.2f}"
        }
