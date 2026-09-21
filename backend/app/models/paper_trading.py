"""
Phase 7 — Enterprise Paper Trading Platform Database Models
Tables: paper_wallets, paper_portfolios, paper_orders, paper_positions,
        paper_transactions, paper_performance, paper_snapshots,
        paper_decisions, recommendation_tracking, research_reports
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class PaperWallet(Base):
    """Engine 1 — Paper Wallet Engine: Virtual Cash & Buying Power."""
    __tablename__ = "paper_wallets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True, default="default_user")
    wallet_name: Mapped[str] = mapped_column(String(100), default="Primary AI Paper Wallet")

    initial_balance: Mapped[float] = mapped_column(Float, default=100000.0)
    cash_balance: Mapped[float] = mapped_column(Float, default=100000.0)
    invested_capital: Mapped[float] = mapped_column(Float, default=0.0)
    buying_power: Mapped[float] = mapped_column(Float, default=100000.0)
    total_portfolio_value: Mapped[float] = mapped_column(Float, default=100000.0)

    total_realized_pl: Mapped[float] = mapped_column(Float, default=0.0)
    total_unrealized_pl: Mapped[float] = mapped_column(Float, default=0.0)
    currency: Mapped[str] = mapped_column(String(10), default="USD")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class PaperPortfolio(Base):
    """Engine 5 — Paper Portfolio Metadata & Aggregate Performance."""
    __tablename__ = "paper_portfolios"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    wallet_id: Mapped[str] = mapped_column(String(36), ForeignKey("paper_wallets.id", ondelete="CASCADE"), nullable=False, index=True)

    portfolio_name: Mapped[str] = mapped_column(String(100), default="AI Multi-Strategy Paper Portfolio")
    total_value: Mapped[float] = mapped_column(Float, default=100000.0)
    cash: Mapped[float] = mapped_column(Float, default=100000.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class PaperPosition(Base):
    """Engine 2 — Paper Positions tracking current virtual holdings."""
    __tablename__ = "paper_positions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    wallet_id: Mapped[str] = mapped_column(String(36), ForeignKey("paper_wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    quantity: Mapped[float] = mapped_column(Float, default=0.0)
    average_entry_price: Mapped[float] = mapped_column(Float, default=0.0)
    current_price: Mapped[float] = mapped_column(Float, default=0.0)

    market_value: Mapped[float] = mapped_column(Float, default=0.0)
    unrealized_pl: Mapped[float] = mapped_column(Float, default=0.0)
    unrealized_pl_pct: Mapped[float] = mapped_column(Float, default=0.0)

    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class PaperOrder(Base):
    """Engine 2 & 3 — Virtual Orders & Execution logs."""
    __tablename__ = "paper_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    wallet_id: Mapped[str] = mapped_column(String(36), ForeignKey("paper_wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    recommendation_id: Mapped[str] = mapped_column(String(36), nullable=True, index=True)

    symbol: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    side: Mapped[str] = mapped_column(String(10), nullable=False) # BUY, SELL, PARTIAL_SELL
    order_type: Mapped[str] = mapped_column(String(20), default="MARKET") # MARKET, LIMIT

    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    order_price: Mapped[float] = mapped_column(Float, nullable=False)
    executed_price: Mapped[float] = mapped_column(Float, nullable=False)
    total_cost: Mapped[float] = mapped_column(Float, nullable=False)

    status: Mapped[str] = mapped_column(String(20), default="FILLED", index=True) # PENDING, FILLED, CANCELLED, REJECTED
    execution_notes: Mapped[str] = mapped_column(Text, default="Virtual order filled at simulated market price")

    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)


class PaperTransaction(Base):
    """Engine 4 — Transaction History Ledger."""
    __tablename__ = "paper_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("paper_orders.id", ondelete="SET NULL"), nullable=True, index=True)
    wallet_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False) # BUY, SELL
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)

    portfolio_snapshot_json: Mapped[str] = mapped_column(Text, default="{}")
    recommendation_id: Mapped[str] = mapped_column(String(36), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)


class PaperPerformance(Base):
    """Engine 5 & 6 — Portfolio & AI performance metrics log."""
    __tablename__ = "paper_performance"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    wallet_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    portfolio_value: Mapped[float] = mapped_column(Float, default=100000.0)
    daily_return: Mapped[float] = mapped_column(Float, default=0.0)
    weekly_return: Mapped[float] = mapped_column(Float, default=0.0)
    monthly_return: Mapped[float] = mapped_column(Float, default=0.0)
    annual_return: Mapped[float] = mapped_column(Float, default=0.0)

    unrealized_pl: Mapped[float] = mapped_column(Float, default=0.0)
    realized_pl: Mapped[float] = mapped_column(Float, default=0.0)

    sharpe_ratio: Mapped[float] = mapped_column(Float, default=1.2)
    sortino_ratio: Mapped[float] = mapped_column(Float, default=1.5)
    max_drawdown: Mapped[float] = mapped_column(Float, default=0.08)
    volatility: Mapped[float] = mapped_column(Float, default=0.14)
    win_rate: Mapped[float] = mapped_column(Float, default=0.68)

    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)


class PaperSnapshot(Base):
    """Engine 7 — Timeline & Historical Snapshot series."""
    __tablename__ = "paper_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    wallet_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    cash_balance: Mapped[float] = mapped_column(Float, default=100000.0)
    invested_value: Mapped[float] = mapped_column(Float, default=0.0)
    total_value: Mapped[float] = mapped_column(Float, default=100000.0)
    holdings_json: Mapped[str] = mapped_column(Text, default="[]")

    snapshot_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)


class PaperDecision(Base):
    """Engine 3 & 8 — Execution & lifecycle of APDE recommendations."""
    __tablename__ = "paper_decisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    wallet_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    card_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    recommendation_title: Mapped[str] = mapped_column(String(150), nullable=False)
    user_action: Mapped[str] = mapped_column(String(20), nullable=False) # ACCEPTED, REJECTED, MODIFIED
    execution_status: Mapped[str] = mapped_column(String(20), default="EXECUTED") # EXECUTED, EXPIRED, FAILED

    initial_portfolio_value: Mapped[float] = mapped_column(Float, nullable=True)
    outcome_portfolio_value: Mapped[float] = mapped_column(Float, nullable=True)
    return_generated_pct: Mapped[float] = mapped_column(Float, nullable=True)
    is_successful: Mapped[bool] = mapped_column(Boolean, nullable=True)

    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)


class RecommendationTracking(Base):
    """Engine 8 & 6 — Full lifecycle tracking of AI predictions & decisions."""
    __tablename__ = "recommendation_tracking"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    card_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    recommendation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="EXECUTED")

    predicted_return_improvement: Mapped[float] = mapped_column(Float, nullable=True)
    actual_return_generated: Mapped[float] = mapped_column(Float, nullable=True)
    prediction_accuracy: Mapped[float] = mapped_column(Float, nullable=True)

    model_used: Mapped[str] = mapped_column(String(50), nullable=True)
    market_regime: Mapped[str] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ResearchReport(Base):
    """Engine 13 — Research & Dissertation Analytics Reports."""
    __tablename__ = "research_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title: Mapped[str] = mapped_column(String(200), default="APDE Performance & Alpha Dissertation Report")
    total_decisions_evaluated: Mapped[int] = mapped_column(Integer, default=0)

    acceptance_rate: Mapped[float] = mapped_column(Float, nullable=True)
    ai_portfolio_sharpe: Mapped[float] = mapped_column(Float, nullable=True)
    benchmark_sharpe: Mapped[float] = mapped_column(Float, nullable=True)
    sharpe_improvement_pct: Mapped[float] = mapped_column(Float, nullable=True)
    risk_reduction_pct: Mapped[float] = mapped_column(Float, nullable=True)
    decision_accuracy_score: Mapped[float] = mapped_column(Float, nullable=True)

    summary_text: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
