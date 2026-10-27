import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Enum, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
import enum


class PeriodType(str, enum.Enum):
    ANNUAL = "ANNUAL"
    QUARTERLY = "QUARTERLY"
    TTM = "TTM"


class AssetFundamental(Base):
    __tablename__ = "asset_fundamentals"
    __table_args__ = (
        UniqueConstraint("asset_id", "reporting_date", "period_type", name="uq_asset_fundamental_period"),
        Index("ix_asset_fund_lookup", "asset_id", "reporting_date"),
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
    symbol: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    
    reporting_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    period_type: Mapped[PeriodType] = mapped_column(String(20), default=PeriodType.ANNUAL)
    
    revenue: Mapped[float] = mapped_column(Float, nullable=True)
    gross_profit: Mapped[float] = mapped_column(Float, nullable=True)
    operating_income: Mapped[float] = mapped_column(Float, nullable=True)
    net_income: Mapped[float] = mapped_column(Float, nullable=True)
    eps: Mapped[float] = mapped_column(Float, nullable=True)
    
    total_assets: Mapped[float] = mapped_column(Float, nullable=True)
    total_liabilities: Mapped[float] = mapped_column(Float, nullable=True)
    total_debt: Mapped[float] = mapped_column(Float, nullable=True)
    total_equity: Mapped[float] = mapped_column(Float, nullable=True)
    cash_and_equivalents: Mapped[float] = mapped_column(Float, nullable=True)
    
    operating_cash_flow: Mapped[float] = mapped_column(Float, nullable=True)
    capital_expenditure: Mapped[float] = mapped_column(Float, nullable=True)
    free_cash_flow: Mapped[float] = mapped_column(Float, nullable=True)
    
    shares_outstanding: Mapped[float] = mapped_column(Float, nullable=True)

    pe_ratio: Mapped[float] = mapped_column(Float, nullable=True)
    peg_ratio: Mapped[float] = mapped_column(Float, nullable=True)
    pb_ratio: Mapped[float] = mapped_column(Float, nullable=True)

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

    asset = relationship("Asset", backref="fundamentals")
