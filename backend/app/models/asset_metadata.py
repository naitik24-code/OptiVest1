import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class AssetMetadata(Base):
    __tablename__ = "asset_metadata"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assets.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    market_cap: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    previous_close: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    open_price: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    day_high: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    day_low: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    volume: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    fifty_two_week_high: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    fifty_two_week_low: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    pe_ratio: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    dividend_yield: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    website: Mapped[str] = mapped_column(String(255), nullable=True)
    ceo: Mapped[str] = mapped_column(String(150), nullable=True)
    employees: Mapped[int] = mapped_column(Float, nullable=True, default=0)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    asset = relationship("Asset", backref="extra_metadata", uselist=False)
