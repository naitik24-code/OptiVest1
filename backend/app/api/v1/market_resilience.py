from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.db.session import get_db
from app.services.data_quality_service import DataValidationService
from app.services.market_calendar_service import MarketCalendarService
from app.services.data_freshness_service import DataFreshnessService
from app.services.event_bus_service import EventBusService
from app.services.cache_service import MultiLevelCacheService
from app.services.ai_readiness_service import AIReadinessValidationService
from app.repositories.asset_repository import AssetRepository
from app.repositories.market_repository import MarketRepository

from app.dependencies.auth import require_admin

router = APIRouter(prefix="/market/resilience", tags=["Market Resilience & Telemetry"], dependencies=[Depends(require_admin)])


@router.get("/quality/report/{symbol}")
def get_data_quality_report(symbol: str, db: Session = Depends(get_db)):
    """Engine 1: Data Quality Report for a specific asset."""
    asset_repo = AssetRepository(db)
    market_repo = MarketRepository(db)
    asset = asset_repo.get_by_symbol(symbol)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{symbol}' not found")

    cached_price = market_repo.get_cached_price(symbol)
    if not cached_price:
        return {"symbol": symbol.upper(), "quality_score": 100.0, "is_valid": True, "anomalies": []}

    from app.schemas.market import MarketQuoteResponse
    quote = MarketQuoteResponse(
        symbol=cached_price.symbol,
        price=cached_price.price,
        previous_close=cached_price.previous_close,
        change_amount=cached_price.change_amount,
        change_percent=cached_price.change_percent,
        volume=cached_price.volume,
        day_high=cached_price.high,
        day_low=cached_price.low,
        open_price=cached_price.open,
        timestamp=cached_price.timestamp.isoformat() if cached_price.timestamp else ""
    )
    is_valid, score, anomalies = DataValidationService.validate_quote(quote)
    return {
        "symbol": symbol.upper(),
        "is_valid": is_valid,
        "quality_score": score,
        "anomalies": anomalies,
        "status": "PASS" if is_valid else "FAIL"
    }


@router.get("/calendar/{exchange}")
def get_market_calendar(exchange: str = "NASDAQ"):
    """Engine 2: Market Calendar status and exchange session hours."""
    return MarketCalendarService.get_market_session_info(exchange)


@router.get("/freshness/{symbol}")
def get_data_freshness(symbol: str, db: Session = Depends(get_db)):
    """Engine 3: Evaluates dataset age and freshness score for a symbol."""
    asset_repo = AssetRepository(db)
    asset = asset_repo.get_by_symbol(symbol)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{symbol}' not found")

    last_updated = asset.updated_at or asset.created_at
    return DataFreshnessService.evaluate_freshness(last_updated)


@router.get("/cache/metrics")
def get_cache_metrics():
    """Engine 5: Multi-level cache performance metrics & hit ratio."""
    return MultiLevelCacheService.get_stats()


@router.get("/events")
def get_domain_event_history(limit: int = Query(default=20, ge=1, le=100)):
    """Engine 4: Domain Event Bus execution history logs."""
    return EventBusService.get_event_history(limit=limit)


@router.get("/ai-readiness/{symbol}")
def get_ai_readiness_report(symbol: str, db: Session = Depends(get_db)):
    """Engine 10: Generates automated AI Dataset Readiness Report for Phase 5."""
    asset_repo = AssetRepository(db)
    market_repo = MarketRepository(db)
    asset = asset_repo.get_by_symbol(symbol)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{symbol}' not found")

    prices = market_repo.get_historical_prices(asset.id, days=100)
    features = market_repo.get_latest_feature_vector(asset.id)
    feature_count = 20 if features else 0

    freshness = DataFreshnessService.evaluate_freshness(asset.updated_at or asset.created_at)

    return AIReadinessValidationService.validate_dataset_readiness(
        symbol=symbol,
        total_bars=len(prices),
        feature_count=feature_count,
        data_quality_score=95.0,
        data_freshness_status=freshness["status"]
    )
