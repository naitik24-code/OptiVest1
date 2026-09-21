import time
import math
import random
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import urllib.request
import json

from app.services.providers.base_provider import BaseMarketDataProvider
from app.schemas.market import MarketQuoteResponse, HistoricalPriceResponse, HistoricalPricePoint

logger = logging.getLogger("optivest.market_provider")


class YahooFinanceProvider(BaseMarketDataProvider):
    """
    Yahoo Finance adapter implementation of BaseMarketDataProvider.
    Uses yfinance if available, falls back to direct REST requests,
    and finally gracefully provides synthetic financial data if offline/rate-limited.
    """

    def __init__(self):
        self.provider_name = "YahooFinance"
        self._yfinance_available = False
        try:
            import yfinance as yf
            self.yf = yf
            self._yfinance_available = True
        except ImportError:
            logger.warning("yfinance package not installed. Using HTTP REST fallback.")

    def get_live_quote(self, symbol: str) -> Optional[MarketQuoteResponse]:
        symbol = symbol.upper().strip()
        
        # 1. Try yfinance library
        if self._yfinance_available:
            try:
                ticker = self.yf.Ticker(symbol)
                info = ticker.fast_info
                price = float(info.last_price)
                prev_close = float(info.previous_close)
                open_p = float(info.open) if hasattr(info, "open") and info.open else price
                day_h = float(info.day_high) if hasattr(info, "day_high") and info.day_high else price
                day_l = float(info.day_low) if hasattr(info, "day_low") and info.day_low else price
                vol = float(info.last_volume) if hasattr(info, "last_volume") and info.last_volume else 0.0
                
                chg = price - prev_close
                chg_pct = (chg / prev_close * 100.0) if prev_close > 0 else 0.0

                return MarketQuoteResponse(
                    symbol=symbol,
                    price=round(price, 2),
                    previous_close=round(prev_close, 2),
                    change_amount=round(chg, 2),
                    change_percent=round(chg_pct, 2),
                    open_price=round(open_p, 2),
                    day_high=round(day_h, 2),
                    day_low=round(day_l, 2),
                    volume=round(vol, 0),
                    currency="USD",
                    exchange="NASDAQ",
                    timestamp=datetime.now(timezone.utc)
                )
            except Exception as e:
                logger.debug(f"yfinance lookup failed for {symbol}: {e}")

        # 2. Try Yahoo Finance HTTP REST API
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1d"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=3) as response:
                data = json.loads(response.read().decode("utf-8"))
                result = data["chart"]["result"][0]
                meta = result["meta"]
                price = meta["regularMarketPrice"]
                prev_close = meta.get("chartPreviousClose", price)
                chg = price - prev_close
                chg_pct = (chg / prev_close * 100.0) if prev_close > 0 else 0.0

                return MarketQuoteResponse(
                    symbol=symbol,
                    price=round(price, 2),
                    previous_close=round(prev_close, 2),
                    change_amount=round(chg, 2),
                    change_percent=round(chg_pct, 2),
                    open_price=round(meta.get("regularMarketDayLow", price), 2),
                    day_high=round(meta.get("regularMarketDayHigh", price), 2),
                    day_low=round(meta.get("regularMarketDayLow", price), 2),
                    volume=float(meta.get("regularMarketVolume", 0)),
                    currency=meta.get("currency", "USD"),
                    exchange=meta.get("exchangeName", "NASDAQ"),
                    timestamp=datetime.now(timezone.utc)
                )
        except Exception as e:
            logger.debug(f"HTTP REST lookup failed for {symbol}: {e}")

        # 3. No fallback allowed in production
        raise ValueError(f"Failed to fetch real market data for {symbol}. Synthetic mocks are disabled.")


    def get_historical_prices(self, symbol: str, timeframe: str = "1M") -> Optional[HistoricalPriceResponse]:
        symbol = symbol.upper().strip()
        days_map = {
            "1M": 30,
            "3M": 90,
            "6M": 180,
            "1Y": 365,
            "5Y": 1825,
            "MAX": 3650
        }
        days = days_map.get(timeframe.upper(), 30)

        # 1. Try yfinance
        if self._yfinance_available:
            try:
                period_map = {"1M": "1mo", "3M": "3mo", "6M": "6mo", "1Y": "1y", "5Y": "5y", "MAX": "max"}
                period = period_map.get(timeframe.upper(), "1mo")
                ticker = self.yf.Ticker(symbol)
                hist = ticker.history(period=period, interval="1d")
                if not hist.empty:
                    points = []
                    for idx, row in hist.iterrows():
                        points.append(HistoricalPricePoint(
                            timestamp=idx.strftime("%Y-%m-%d"),
                            open=round(float(row["Open"]), 2),
                            high=round(float(row["High"]), 2),
                            low=round(float(row["Low"]), 2),
                            close=round(float(row["Close"]), 2),
                            adj_close=round(float(row["Close"]), 2),
                            volume=round(float(row["Volume"]), 0)
                        ))
                    return HistoricalPriceResponse(
                        symbol=symbol,
                        timeframe=timeframe,
                        count=len(points),
                        data=points
                    )
            except Exception as e:
                logger.debug(f"yfinance historical lookup failed for {symbol}: {e}")

        # 2. No fallback allowed in production
        raise ValueError(f"Failed to fetch real historical data for {symbol}. Synthetic mocks are disabled.")

    def get_fundamentals(self, symbol: str, exchange: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Extract real multi-period annual financial statements via yfinance.
        Strictly returns None for missing items; never fabricates defaults or zeros.
        """
        symbol = symbol.upper().strip()
        if not self._yfinance_available:
            return []
            
        tickers_to_try = [symbol]
        if exchange and exchange.upper() == "NSE" and not symbol.endswith(".NS"):
            tickers_to_try.append(f"{symbol}.NS")
        elif not ("." in symbol):
            tickers_to_try.append(f"{symbol}.NS")

        ticker = None
        income, balance, cashflow = None, None, None
        for sym in tickers_to_try:
            try:
                t = self.yf.Ticker(sym)
                inc = t.income_stmt
                bal = t.balance_sheet
                cf = t.cashflow
                if not (inc.empty and bal.empty and cf.empty):
                    ticker = t
                    income, balance, cashflow = inc, bal, cf
                    break
            except Exception as e:
                logger.debug(f"Lookup attempt failed for {sym}: {e}")

        if ticker is None or (income.empty and balance.empty and cashflow.empty):
            return []

        def safe_get(df, index_names, col) -> Optional[float]:
            if df is None or df.empty:
                return None
            if isinstance(index_names, str):
                index_names = [index_names]
            for idx in index_names:
                try:
                    if idx in df.index and col in df.columns:
                        val = df.loc[idx, col]
                        if val is not None and not (isinstance(val, float) and math.isnan(val)):
                            return float(val)
                except Exception:
                    pass
            return None

        # Gather all unique period column dates across available statements
        dates = []
        for df in [income, balance, cashflow]:
            if df is not None and not df.empty:
                for c in df.columns:
                    if c not in dates:
                        dates.append(c)
        dates.sort(reverse=True)

        info = None
        try:
            info = ticker.fast_info
        except Exception:
            pass

        shares = None
        if info and hasattr(info, "shares") and info.shares is not None and not math.isnan(info.shares):
            shares = float(info.shares)

        results = []
        for d in dates:
            rep_date = d.to_pydatetime() if hasattr(d, 'to_pydatetime') else d
            if hasattr(rep_date, 'tzinfo') and rep_date.tzinfo is not None:
                rep_date = rep_date.replace(tzinfo=None)

            period_data = {
                "symbol": symbol,
                "reporting_date": rep_date,
                "period_type": "ANNUAL",
                "revenue": safe_get(income, ["Total Revenue", "Operating Revenue"], d),
                "gross_profit": safe_get(income, ["Gross Profit"], d),
                "operating_income": safe_get(income, ["Operating Income", "Total Operating Income As Reported"], d),
                "net_income": safe_get(income, ["Net Income", "Net Income Common Stockholders"], d),
                "eps": safe_get(income, ["Diluted EPS", "Basic EPS"], d),
                
                "total_assets": safe_get(balance, ["Total Assets"], d),
                "total_liabilities": safe_get(balance, ["Total Liabilities Net Minority Interest", "Total Liabilities"], d),
                "total_debt": safe_get(balance, ["Total Debt"], d),
                "total_equity": safe_get(balance, ["Stockholders Equity", "Common Stock Equity", "Total Equity Gross Minority Interest"], d),
                "cash_and_equivalents": safe_get(balance, ["Cash And Cash Equivalents", "Cash Cash Equivalents And Short Term Investments"], d),
                
                "operating_cash_flow": safe_get(cashflow, ["Operating Cash Flow", "Cash Flow From Continuing Operating Activities"], d),
                "capital_expenditure": safe_get(cashflow, ["Capital Expenditure"], d),
                "free_cash_flow": safe_get(cashflow, ["Free Cash Flow"], d),
                "shares_outstanding": shares
            }

            has_data = any(
                period_data[k] is not None
                for k in ["revenue", "net_income", "operating_income", "total_assets", "total_equity", "operating_cash_flow"]
            )
            if has_data:
                results.append(period_data)

        return results

    def search_assets(self, query: str) -> List[Dict[str, Any]]:
        query = query.strip().upper()
        # Common pre-populated asset master database
        canonical_assets = [
            {"symbol": "AAPL", "company_name": "Apple Inc.", "exchange": "NASDAQ", "sector": "Technology", "industry": "Consumer Electronics", "price": 185.50},
            {"symbol": "NVDA", "company_name": "NVIDIA Corporation", "exchange": "NASDAQ", "sector": "Technology", "industry": "Semiconductors", "price": 780.20},
            {"symbol": "MSFT", "company_name": "Microsoft Corporation", "exchange": "NASDAQ", "sector": "Technology", "industry": "Software", "price": 415.30},
            {"symbol": "GOOGL", "company_name": "Alphabet Inc.", "exchange": "NASDAQ", "sector": "Communication", "industry": "Internet Content", "price": 175.10},
            {"symbol": "AMZN", "company_name": "Amazon.com Inc.", "exchange": "NASDAQ", "sector": "Consumer Cyclical", "industry": "Internet Retail", "price": 180.40},
            {"symbol": "TSLA", "company_name": "Tesla Inc.", "exchange": "NASDAQ", "sector": "Consumer Cyclical", "industry": "Auto Manufacturers", "price": 210.60},
            {"symbol": "JPM", "company_name": "JPMorgan Chase & Co.", "exchange": "NYSE", "sector": "Financial", "industry": "Diversified Banking", "price": 195.00},
            {"symbol": "HDFCBANK", "company_name": "HDFC Bank Limited", "exchange": "NYSE", "sector": "Financial", "industry": "Banking", "price": 65.20},
            {"symbol": "ICICIBANK", "company_name": "ICICI Bank Limited", "exchange": "NYSE", "sector": "Financial", "industry": "Banking", "price": 24.80},
            {"symbol": "RELIANCE", "company_name": "Reliance Industries", "exchange": "NSE", "sector": "Energy", "industry": "Oil & Gas", "price": 1420.00},
            {"symbol": "INFY", "company_name": "Infosys Limited", "exchange": "NYSE", "sector": "Technology", "industry": "IT Services", "price": 18.50},
            {"symbol": "TCS", "company_name": "Tata Consultancy Services", "exchange": "NSE", "sector": "Technology", "industry": "IT Services", "price": 4100.00},
        ]
        
        filtered = [
            a for a in canonical_assets
            if query in a["symbol"] or query in a["company_name"].upper() or query in a["sector"].upper() or query in a["exchange"].upper()
        ]
        return filtered if filtered else canonical_assets[:5]
