import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class MarketSyncLog(Base):
    __tablename__ = "market_sync_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    sync_type: Mapped[str] = mapped_column(
        String(50),
        default="LIVE_PRICES",
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="IN_PROGRESS",
        nullable=False,
        index=True
    )
    symbols_processed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    symbols_failed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
