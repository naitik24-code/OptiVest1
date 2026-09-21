import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class FeatureStore(Base):
    """
    Enterprise Feature Store Model.
    Stores pre-engineered technical and statistical features per asset/timestamp
    ready for machine learning models (Phase 5: AI Prediction Engine).
    """
    __tablename__ = "feature_store"
    __table_args__ = (
        UniqueConstraint("asset_id", "timestamp", name="uq_feature_store_asset_timestamp"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    symbol: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # Moving Averages
    sma_20: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    sma_50: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    sma_200: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    ema_12: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    ema_26: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)

    # Momentum & Oscillators
    rsi_14: Mapped[float] = mapped_column(Float, nullable=True, default=50.0)
    macd: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    macd_signal: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    macd_histogram: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    roc_10: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)  # Rate of Change (10-day)
    momentum_14: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)

    # Volatility & Trend
    atr_14: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)  # Average True Range
    adx_14: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)  # Average Directional Index
    volatility_30d: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    bollinger_upper: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    bollinger_middle: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    bollinger_lower: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)

    # Returns & Range Features
    daily_return: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    weekly_return: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    monthly_return: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    volume_change_pct: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    fifty_two_week_pos_pct: Mapped[float] = mapped_column(Float, nullable=True, default=50.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    asset = relationship("Asset", backref="features")
