import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    max_reallocation_pct: Mapped[float] = mapped_column(
        Numeric(5, 2),
        default=15.00,
        nullable=False
    )
    risk_tolerance_level: Mapped[int] = mapped_column(
        Integer,
        default=3,
        nullable=False
    )
    preferred_benchmark: Mapped[str] = mapped_column(
        String(50),
        default="SP500",
        nullable=False
    )
    investment_goal: Mapped[str] = mapped_column(
        String(100),
        default="Growth",
        nullable=False
    )
    timezone: Mapped[str] = mapped_column(
        String(50),
        default="UTC",
        nullable=False
    )
    preferred_currency: Mapped[str] = mapped_column(
        String(10),
        default="USD",
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

    # Relationship back to User
    user: Mapped["User"] = relationship(
        "User",
        back_populates="preference"
    )
