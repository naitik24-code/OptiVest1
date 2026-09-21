from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class MarketQuoteResponse(BaseModel):
    symbol: str
    price: float
    previous_close: float = 0.0
    change_amount: float = 0.0
    change_percent: float = 0.0
    open_price: float = 0.0
    day_high: float = 0.0
    day_low: float = 0.0
    volume: float = 0.0
    currency: str = "USD"
    exchange: str = "NASDAQ"
    market_cap: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    pe_ratio: Optional[float] = None
    timestamp: datetime


class HistoricalPricePoint(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    adj_close: float
    volume: float


class HistoricalPriceResponse(BaseModel):
    symbol: str
    timeframe: str  # 1M, 3M, 6M, 1Y, 5Y, MAX
    count: int
    data: List[HistoricalPricePoint]


class AssetSearchResult(BaseModel):
    id: Optional[str] = None
    symbol: str
    company_name: str
    exchange: str
    sector: str
    industry: str
    asset_type: str = "EQUITY"
    currency: str = "USD"
    country: str = "USA"
    price: float
    change_percent: float = 0.0
    market_cap: Optional[float] = None


class MarketSyncRequest(BaseModel):
    symbols: Optional[List[str]] = Field(default=None, description="Optional specific tickers to sync. If empty, syncs all active assets.")
    sync_type: str = Field(default="LIVE_PRICES", description="LIVE_PRICES, HISTORICAL, or FULL")


class MarketSyncStatusResponse(BaseModel):
    id: str
    sync_type: str
    status: str  # IN_PROGRESS, SUCCESS, FAILED, PARTIAL
    symbols_processed: int
    symbols_failed: int
    details: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class CompanyProfileResponse(BaseModel):
    symbol: str
    company_name: str
    exchange: str
    sector: str
    industry: str
    country: str
    currency: str
    market_cap: float = 0.0
    pe_ratio: float = 0.0
    dividend_yield: float = 0.0
    description: Optional[str] = None
    website: Optional[str] = None
    ceo: Optional[str] = None
    employees: Optional[int] = None
    fifty_two_week_high: float = 0.0
    fifty_two_week_low: float = 0.0


class TechnicalIndicatorsResponse(BaseModel):
    symbol: str
    current_price: float
    sma_20: float
    sma_50: float
    sma_200: float
    ema_12: float
    ema_26: float
    rsi_14: float
    macd: float
    macd_signal: float
    macd_histogram: float
    bollinger_upper: float
    bollinger_middle: float
    bollinger_lower: float
    avg_volume_20: float
    price_change_pct_24h: float
    fifty_two_week_position_pct: float
    golden_cross_signal: bool  # True if SMA 50 > SMA 200
    short_term_trend: str  # BULLISH, BEARISH, NEUTRAL


class MarketIndexQuote(BaseModel):
    name: str
    symbol: str
    value: float
    change: float
    change_percent: float


class SectorPerformanceItem(BaseModel):
    sector: str
    change_percent: float
    asset_count: int


class MarketOverviewResponse(BaseModel):
    indices: List[MarketIndexQuote]
    top_gainers: List[AssetSearchResult]
    top_losers: List[AssetSearchResult]
    most_active: List[AssetSearchResult]
    sector_performance: List[SectorPerformanceItem]
    total_tracked_assets: int

