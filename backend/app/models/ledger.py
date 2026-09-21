import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class Ledger(Base):
    __tablename__ = "ledgers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    portfolio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("portfolios.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    entry_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False  # DEPOSIT, WITHDRAWAL, FEE, TRADE
    )
    amount: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )
    balance_after: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    portfolio = relationship("Portfolio")
    transaction = relationship("Transaction")
