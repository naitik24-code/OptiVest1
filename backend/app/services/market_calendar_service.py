from datetime import datetime, date, time, timezone
from typing import Dict, Any


class MarketCalendarService:
    """
    Engine 2: Market Calendar Engine.
    Handles exchange trading calendars (NYSE, NASDAQ, NSE, BSE), weekend detection,
    market hours, and trading session queries.
    """

    EXCHANGE_HOURS = {
        "NASDAQ": {"open": "14:30", "close": "21:00", "tz": "UTC"},
        "NYSE": {"open": "14:30", "close": "21:00", "tz": "UTC"},
        "NSE": {"open": "03:45", "close": "10:00", "tz": "UTC"},
        "BSE": {"open": "03:45", "close": "10:00", "tz": "UTC"},
    }

    US_HOLIDAYS_2026 = {
        "2026-01-01": "New Year's Day",
        "2026-01-19": "Martin Luther King Jr. Day",
        "2026-02-16": "Presidents' Day",
        "2026-04-03": "Good Friday",
        "2026-05-25": "Memorial Day",
        "2026-06-19": "Juneteenth",
        "2026-07-03": "Independence Day (Observed)",
        "2026-09-07": "Labor Day",
        "2026-11-26": "Thanksgiving Day",
        "2026-12-25": "Christmas Day",
    }

    @staticmethod
    def is_market_open(exchange: str = "NASDAQ", target_dt: datetime = None) -> bool:
        """Determines if the specified exchange is currently open for regular trading."""
        if target_dt is None:
            target_dt = datetime.now(timezone.utc)

        # Check weekend
        if target_dt.weekday() in (5, 6):  # Saturday or Sunday
            return False

        # Check holiday
        date_str = target_dt.strftime("%Y-%m-%d")
        if exchange.upper() in ("NASDAQ", "NYSE") and date_str in MarketCalendarService.US_HOLIDAYS_2026:
            return False

        # Check session hours
        hours = MarketCalendarService.EXCHANGE_HOURS.get(exchange.upper(), MarketCalendarService.EXCHANGE_HOURS["NASDAQ"])
        open_time = datetime.strptime(hours["open"], "%H:%M").time()
        close_time = datetime.strptime(hours["close"], "%H:%M").time()
        current_time = target_dt.time()

        return open_time <= current_time <= close_time

    @staticmethod
    def get_market_session_info(exchange: str = "NASDAQ") -> Dict[str, Any]:
        """Returns structured session state for an exchange."""
        now = datetime.now(timezone.utc)
        is_open = MarketCalendarService.is_market_open(exchange, now)
        hours = MarketCalendarService.EXCHANGE_HOURS.get(exchange.upper(), MarketCalendarService.EXCHANGE_HOURS["NASDAQ"])

        return {
            "exchange": exchange.upper(),
            "is_open": is_open,
            "session_status": "OPEN" if is_open else "CLOSED",
            "current_utc_time": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "regular_open_utc": hours["open"],
            "regular_close_utc": hours["close"],
            "is_weekend": now.weekday() in (5, 6),
            "holiday": MarketCalendarService.US_HOLIDAYS_2026.get(now.strftime("%Y-%m-%d"))
        }
