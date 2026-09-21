from uuid import UUID
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, delete, desc

from app.models.market_price import MarketPrice
from app.models.asset_metadata import AssetMetadata
from app.models.price_cache import PriceCache
from app.models.market_sync_log import MarketSyncLog
from app.models.asset import Asset
from app.schemas.market import MarketQuoteResponse, HistoricalPricePoint


class MarketRepository:
    def __init__(self, db: Session):
        self.db = db

    # 1. Price Cache Operations
    def get_cached_price(self, symbol: str) -> Optional[PriceCache]:
        symbol = symbol.upper().strip()
        return self.db.query(PriceCache).filter(PriceCache.symbol == symbol).first()


    def upsert_price_cache(self, quote: MarketQuoteResponse) -> PriceCache:
        symbol = quote.symbol.upper().strip()
        cached = self.get_cached_price(symbol)
        now = datetime.now(timezone.utc)

        if cached:
            cached.price = quote.price
            cached.previous_close = quote.previous_close
            cached.change_amount = quote.change_amount
            cached.change_percent = quote.change_percent
            cached.volume = quote.volume
            cached.high = quote.day_high
            cached.low = quote.day_low
            cached.open = quote.open_price
            cached.timestamp = quote.timestamp
            cached.updated_at = now
        else:
            cached = PriceCache(
                symbol=symbol,
                price=quote.price,
                previous_close=quote.previous_close,
                change_amount=quote.change_amount,
                change_percent=quote.change_percent,
                volume=quote.volume,
                high=quote.day_high,
                low=quote.day_low,
                open=quote.open_price,
                timestamp=quote.timestamp,
                updated_at=now
            )
            self.db.add(cached)

        # Also update price on Asset table if asset exists
        asset = self.db.query(Asset).filter(Asset.symbol == symbol).first()
        if asset:
            asset.price = quote.price
            asset.updated_at = now

        self.db.commit()
        self.db.refresh(cached)
        return cached

    # 2. Historical Prices Operations
    def get_historical_prices(self, asset_id: Union[UUID, str], days: int = 30) -> List[MarketPrice]:
        if isinstance(asset_id, str):
            try:
                asset_id = UUID(asset_id)
            except ValueError:
                return []

        return (
            self.db.query(MarketPrice)
            .filter(MarketPrice.asset_id == asset_id)
            .order_by(MarketPrice.timestamp.asc())
            .limit(days)
            .all()
        )

    def save_historical_prices(self, asset_id: UUID, symbol: str, points: List[HistoricalPricePoint]) -> int:
        count = 0
        symbol = symbol.upper().strip()
        for p in points:
            try:
                ts = datetime.strptime(p.timestamp, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except Exception:
                ts = datetime.now(timezone.utc)

            # Check existing point
            existing = (
                self.db.query(MarketPrice)
                .filter(MarketPrice.asset_id == asset_id, MarketPrice.timestamp == ts)
                .first()
            )
            if existing:
                existing.open = p.open
                existing.high = p.high
                existing.low = p.low
                existing.close = p.close
                existing.adj_close = p.adj_close
                existing.volume = p.volume
            else:
                mp = MarketPrice(
                    asset_id=asset_id,
                    symbol=symbol,
                    timestamp=ts,
                    open=p.open,
                    high=p.high,
                    low=p.low,
                    close=p.close,
                    adj_close=p.adj_close,
                    volume=p.volume
                )
                self.db.add(mp)
                count += 1

        self.db.commit()
        return count

    # 3. Asset Metadata Operations
    def get_asset_metadata(self, asset_id: UUID) -> Optional[AssetMetadata]:
        return self.db.query(AssetMetadata).filter(AssetMetadata.asset_id == asset_id).first()

    def upsert_asset_metadata(self, asset_id: UUID, quote: MarketQuoteResponse) -> AssetMetadata:
        meta = self.get_asset_metadata(asset_id)
        now = datetime.now(timezone.utc)
        if meta:
            meta.market_cap = quote.market_cap or meta.market_cap
            meta.previous_close = quote.previous_close
            meta.open_price = quote.open_price
            meta.day_high = quote.day_high
            meta.day_low = quote.day_low
            meta.volume = quote.volume
            meta.fifty_two_week_high = quote.fifty_two_week_high or meta.fifty_two_week_high
            meta.fifty_two_week_low = quote.fifty_two_week_low or meta.fifty_two_week_low
            meta.pe_ratio = quote.pe_ratio or meta.pe_ratio
            meta.updated_at = now
        else:
            meta = AssetMetadata(
                asset_id=asset_id,
                market_cap=quote.market_cap or 0.0,
                previous_close=quote.previous_close,
                open_price=quote.open_price,
                day_high=quote.day_high,
                day_low=quote.day_low,
                volume=quote.volume,
                fifty_two_week_high=quote.fifty_two_week_high or 0.0,
                fifty_two_week_low=quote.fifty_two_week_low or 0.0,
                pe_ratio=quote.pe_ratio or 0.0,
                updated_at=now
            )
            self.db.add(meta)

        self.db.commit()
        self.db.refresh(meta)
        return meta

    # 4. Market Sync Logs Operations
    def create_sync_log(self, sync_type: str = "LIVE_PRICES") -> MarketSyncLog:
        log = MarketSyncLog(
            sync_type=sync_type,
            status="IN_PROGRESS",
            symbols_processed=0,
            symbols_failed=0,
            created_at=datetime.now(timezone.utc)
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def update_sync_log(self, log_id: UUID, status: str, processed: int, failed: int, details: Optional[str] = None) -> MarketSyncLog:
        log = self.db.query(MarketSyncLog).filter(MarketSyncLog.id == log_id).first()
        if log:
            log.status = status
            log.symbols_processed = processed
            log.symbols_failed = failed
            log.details = details
            log.completed_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(log)
        return log

    def list_sync_logs(self, limit: int = 20) -> List[MarketSyncLog]:
        return self.db.query(MarketSyncLog).order_by(desc(MarketSyncLog.created_at)).limit(limit).all()

    # 5. Feature Store Operations (Engine 7)


    def get_latest_feature_vector(self, asset_id: UUID):
        from app.models.feature_store import FeatureStore
        return (
            self.db.query(FeatureStore)
            .filter(FeatureStore.asset_id == asset_id)
            .order_by(desc(FeatureStore.timestamp))
            .first()
        )
