from typing import List, Optional
from fastapi import APIRouter, Depends, Query, BackgroundTasks, HTTPException, status

from app.dependencies.auth import get_current_user, get_optional_current_user
from app.dependencies.market import get_market_service
from app.services.market_service import MarketService
from app.models.user import User
from app.schemas.common import ResponseEnvelope
from app.schemas.market import (
    MarketQuoteResponse,
    HistoricalPriceResponse,
    AssetSearchResult,
    MarketSyncRequest,
    MarketSyncStatusResponse,
    CompanyProfileResponse,
    TechnicalIndicatorsResponse,
    MarketOverviewResponse
)

router = APIRouter(prefix="/market", tags=["Market Data Engine"])


@router.get("/search", response_model=ResponseEnvelope[List[AssetSearchResult]])
def search_market_assets(
    q: str = Query("", description="Ticker, company name, exchange, or sector search term"),
    market_service: MarketService = Depends(get_market_service),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Intelligent asset search with autocomplete support.
    Searches ticker symbols, company names, exchanges, and sectors.
    """
    results = market_service.search_assets(q)
    return ResponseEnvelope(success=True, data=results)


@router.get("/quote/{symbol}", response_model=ResponseEnvelope[MarketQuoteResponse])
def get_live_market_quote(
    symbol: str,
    market_service: MarketService = Depends(get_market_service),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Fetch live real-time or cached quote for a single symbol."""
    quote = market_service.get_live_quote(symbol)
    return ResponseEnvelope(success=True, data=quote)


@router.get("/history/{symbol}", response_model=ResponseEnvelope[HistoricalPriceResponse])
def get_historical_market_prices(
    symbol: str,
    timeframe: str = Query("1M", description="Timeframe window: 1M, 3M, 6M, 1Y, 5Y, MAX"),
    market_service: MarketService = Depends(get_market_service),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Fetch daily OHLCV historical prices for charts & analytics."""
    history = market_service.get_historical_prices(symbol, timeframe=timeframe)
    return ResponseEnvelope(success=True, data=history)


@router.post("/sync", response_model=ResponseEnvelope[MarketSyncStatusResponse])
def trigger_market_sync(
    request: MarketSyncRequest,
    background_tasks: BackgroundTasks,
    market_service: MarketService = Depends(get_market_service),
    current_user: User = Depends(get_current_user)
):
    """Trigger background synchronization of live prices & historical OHLCV data."""
    # Execute sync job
    sync_status = market_service.sync_market_data(symbols=request.symbols, sync_type=request.sync_type)
    return ResponseEnvelope(success=True, data=sync_status)


@router.get("/sync/status", response_model=ResponseEnvelope[List[MarketSyncStatusResponse]])
def get_market_sync_status(
    limit: int = Query(10, ge=1, le=100),
    market_service: MarketService = Depends(get_market_service),
    current_user: User = Depends(get_current_user)
):
    """Retrieve audit history of market synchronization jobs."""
    logs = market_service.get_sync_status(limit=limit)
    return ResponseEnvelope(success=True, data=logs)


@router.post("/refresh/{symbol}", response_model=ResponseEnvelope[MarketQuoteResponse])
def force_refresh_symbol_quote(
    symbol: str,
    market_service: MarketService = Depends(get_market_service),
    current_user: User = Depends(get_current_user)
):
    """Bypass cache and force an immediate price refresh for a specific symbol."""
    quote = market_service.get_live_quote(symbol)
    return ResponseEnvelope(success=True, data=quote)


@router.get("/profile/{symbol}", response_model=ResponseEnvelope[CompanyProfileResponse])
def get_company_profile(
    symbol: str,
    market_service: MarketService = Depends(get_market_service),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Fetch company profile metadata (CEO, website, description, market cap, financial ratios)."""
    profile = market_service.get_company_profile(symbol)
    return ResponseEnvelope(success=True, data=profile)


@router.get("/indicators/{symbol}", response_model=ResponseEnvelope[TechnicalIndicatorsResponse])
def get_technical_indicators(
    symbol: str,
    market_service: MarketService = Depends(get_market_service),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Fetch mathematical technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, Crossovers)."""
    indicators = market_service.get_technical_indicators(symbol)
    return ResponseEnvelope(success=True, data=indicators)


@router.get("/overview", response_model=ResponseEnvelope[MarketOverviewResponse])
def get_market_overview(
    market_service: MarketService = Depends(get_market_service),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Fetch market overview indices, top gainers, top losers, most active, and sector performance."""
    overview = market_service.get_market_overview()
    return ResponseEnvelope(success=True, data=overview)
