import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class DataQualityLog(Base):
    """Stores data validation audit logs and quality checks."""
    __tablename__ = "data_quality_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    symbol: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    dataset_type: Mapped[str] = mapped_column(String(50), nullable=False)  # QUOTE, OHLCV, METADATA
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    quality_score: Mapped[float] = mapped_column(Float, default=100.0)  # 0.0 to 100.0 score
    anomaly_type: Mapped[str] = mapped_column(String(100), nullable=True)
    details: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class MarketCalendar(Base):
    """Exchange trading calendars (NYSE, NASDAQ, NSE, BSE)."""
    __tablename__ = "market_calendar"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    exchange: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    date_str: Mapped[str] = mapped_column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    is_trading_day: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_half_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    holiday_name: Mapped[str] = mapped_column(String(100), nullable=True)
    session_open_utc: Mapped[str] = mapped_column(String(10), default="14:30")
    session_close_utc: Mapped[str] = mapped_column(String(10), default="21:00")


class CorporateAction(Base):
    """Stores corporate actions like stock splits, reverse splits, and dividends."""
    __tablename__ = "corporate_actions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    asset_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    action_type: Mapped[str] = mapped_column(String(30), nullable=False)  # SPLIT, REVERSE_SPLIT, DIVIDEND, BONUS
    ex_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    split_ratio: Mapped[float] = mapped_column(Float, default=1.0)  # e.g., 2.0 for 2-for-1 split
    dividend_amount: Mapped[float] = mapped_column(Float, default=0.0)
    adjustment_factor: Mapped[float] = mapped_column(Float, default=1.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class EventLog(Base):
    """Domain event bus activity audit log."""
    __tablename__ = "event_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    publisher: Mapped[str] = mapped_column(String(100), nullable=False)
    payload_summary: Mapped[str] = mapped_column(Text, nullable=True)
    subscribers_notified: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class PipelineMetric(Base):
    """Stores telemetry data on market pipeline performance."""
    __tablename__ = "pipeline_metrics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    metric_value: Mapped[float] = mapped_column(Float, nullable=False)
    dimensions: Mapped[str] = mapped_column(String(255), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class CacheStatistic(Base):
    """Tracks L1/L2 multi-level cache metrics."""
    __tablename__ = "cache_statistics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    cache_level: Mapped[str] = mapped_column(String(20), nullable=False)  # L1_MEMORY, L2_REDIS, L3_DB
    hits: Mapped[int] = mapped_column(Integer, default=0)
    misses: Mapped[int] = mapped_column(Integer, default=0)
    hit_ratio_pct: Mapped[float] = mapped_column(Float, default=100.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class FreshnessStatus(Base):
    """Tracks data age and freshness level of asset datasets."""
    __tablename__ = "freshness_status"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    asset_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    data_age_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default="FRESH")  # FRESH, STALE, EXPIRED
    freshness_score: Mapped[float] = mapped_column(Float, default=100.0)
