import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    symbol: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )
    company_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )
    exchange: Mapped[str] = mapped_column(
        String(50),
        default="NASDAQ",
        nullable=False
    )
    sector: Mapped[str] = mapped_column(
        String(100),
        default="Technology",
        nullable=False
    )
    industry: Mapped[str] = mapped_column(
        String(100),
        default="Software",
        nullable=False
    )
    asset_type: Mapped[str] = mapped_column(
        String(50),
        default="EQUITY",
        nullable=False
    )
    currency: Mapped[str] = mapped_column(
        String(10),
        default="USD",
        nullable=False
    )
    country: Mapped[str] = mapped_column(
        String(50),
        default="USA",
        nullable=False
    )
    price: Mapped[float] = mapped_column(
        Float,
        default=100.0,
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
