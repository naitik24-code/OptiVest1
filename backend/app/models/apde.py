"""
Phase 6 — Adaptive Portfolio Decision Engine (APDE) Database Models
Tables: portfolio_health, portfolio_analysis, decision_cards, decision_history,
        decision_scores, optimization_results, scenario_simulations, portfolio_snapshots
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class PortfolioHealth(Base):
    """Engine 1 — Portfolio Health Engine: Health score, diversification, risk metrics."""
    __tablename__ = "portfolio_health"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    portfolio_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    health_score: Mapped[float] = mapped_column(Float, default=75.0)          # 0–100
    diversification_score: Mapped[float] = mapped_column(Float, default=70.0)   # 0–100
    risk_score: Mapped[float] = mapped_column(Float, default=50.0)            # 0–100
    overall_health_rating: Mapped[str] = mapped_column(String(30), default="EXCELLENT") # EXCELLENT, GOOD, FAIR, POOR, CRITICAL

    # Concentrations & Risk
    sector_concentration: Mapped[float] = mapped_column(Float, default=0.25)
    asset_concentration: Mapped[float] = mapped_column(Float, default=0.30)
    expected_return_annual: Mapped[float] = mapped_column(Float, default=0.12)
    portfolio_volatility: Mapped[float] = mapped_column(Float, default=0.15)
    sharpe_ratio: Mapped[float] = mapped_column(Float, default=1.2)
    sortino_ratio: Mapped[float] = mapped_column(Float, default=1.5)
    max_drawdown_pct: Mapped[float] = mapped_column(Float, default=0.10)
    beta: Mapped[float] = mapped_column(Float, default=1.0)
    alpha: Mapped[float] = mapped_column(Float, default=0.03)

    correlation_matrix: Mapped[str] = mapped_column(Text, default="{}")       # JSON
    sector_breakdown: Mapped[str] = mapped_column(Text, default="{}")         # JSON
    asset_allocations: Mapped[str] = mapped_column(Text, default="{}")        # JSON

    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)


class PortfolioAnalysis(Base):
    """Engine 2 & 8 — Detailed portfolio analysis & optimization state."""
    __tablename__ = "portfolio_analysis"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    portfolio_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    market_regime: Mapped[str] = mapped_column(String(50), default="SIDEWAYS_MARKET")
    risk_tolerance: Mapped[str] = mapped_column(String(20), default="MODERATE") # CONSERVATIVE, MODERATE, AGGRESSIVE
    investment_horizon: Mapped[str] = mapped_column(String(20), default="30D")  # 1D, 5D, 30D, 90D
    max_reallocation_pct: Mapped[float] = mapped_column(Float, default=0.20)

    recommended_action: Mapped[str] = mapped_column(String(50), default="NO_ACTION") # NO_ACTION, REDUCE, INCREASE, REPLACE, DIVERSIFY, DELAY
    confidence_score: Mapped[float] = mapped_column(Float, default=0.85)
    expected_return_delta: Mapped[float] = mapped_column(Float, default=0.02)
    risk_reduction_delta: Mapped[float] = mapped_column(Float, default=-0.015)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class DecisionCard(Base):
    """Engine 6 — Decision Card Engine: Structured recommendation cards."""
    __tablename__ = "decision_cards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    portfolio_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    recommendation_type: Mapped[str] = mapped_column(String(50), nullable=False) # REDUCE_POSITION, INCREASE_POSITION, REPLACE_ASSET, DIVERSIFY, NO_ACTION

    source_asset: Mapped[str] = mapped_column(String(20), nullable=True)
    target_asset: Mapped[str] = mapped_column(String(20), nullable=True)
    reallocation_pct: Mapped[float] = mapped_column(Float, default=0.05)
    capital_amount: Mapped[float] = mapped_column(Float, default=1000.0)

    current_allocation_pct: Mapped[float] = mapped_column(Float, default=0.20)
    proposed_allocation_pct: Mapped[float] = mapped_column(Float, default=0.15)

    expected_return_improvement: Mapped[float] = mapped_column(Float, default=0.035)
    risk_reduction_pct: Mapped[float] = mapped_column(Float, default=0.02)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.88)
    decision_score: Mapped[float] = mapped_column(Float, default=85.0)  # 0–100

    # Engine 5 — Explainability
    why_this_stock: Mapped[str] = mapped_column(Text, nullable=False)
    why_not_another: Mapped[str] = mapped_column(Text, nullable=False)
    why_now: Mapped[str] = mapped_column(Text, nullable=False)
    why_this_percentage: Mapped[str] = mapped_column(Text, nullable=False)
    model_used: Mapped[str] = mapped_column(String(50), default="ENSEMBLE")
    market_regime: Mapped[str] = mapped_column(String(50), default="BULL_MARKET")

    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True) # PENDING, ACCEPTED, REJECTED, MODIFIED

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)


class DecisionHistory(Base):
    """Engine 9 — Decision History: Stores accepted, rejected, and modified decisions."""
    __tablename__ = "decision_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    card_id: Mapped[str] = mapped_column(String(36), ForeignKey("decision_cards.id", ondelete="SET NULL"), nullable=True, index=True)
    portfolio_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    action_taken: Mapped[str] = mapped_column(String(20), nullable=False) # ACCEPTED, REJECTED, MODIFIED
    recommendation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_asset: Mapped[str] = mapped_column(String(20), nullable=True)
    target_asset: Mapped[str] = mapped_column(String(20), nullable=True)
    reallocation_pct: Mapped[float] = mapped_column(Float, default=0.0)

    predictions_used: Mapped[str] = mapped_column(Text, default="{}")    # JSON
    confidence_score: Mapped[float] = mapped_column(Float, default=0.85)
    market_regime: Mapped[str] = mapped_column(String(50), default="SIDEWAYS_MARKET")
    portfolio_snapshot: Mapped[str] = mapped_column(Text, default="{}") # JSON

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)


class DecisionScore(Base):
    """Engine 13 — Decision Scoring Engine: Detailed score components per card."""
    __tablename__ = "decision_scores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    card_id: Mapped[str] = mapped_column(String(36), ForeignKey("decision_cards.id", ondelete="CASCADE"), nullable=False, index=True)

    total_score: Mapped[float] = mapped_column(Float, default=85.0) # 0–100
    expected_return_subscore: Mapped[float] = mapped_column(Float, default=25.0) # Max 30
    risk_reduction_subscore: Mapped[float] = mapped_column(Float, default=20.0) # Max 25
    diversification_subscore: Mapped[float] = mapped_column(Float, default=15.0) # Max 20
    confidence_subscore: Mapped[float] = mapped_column(Float, default=15.0)    # Max 15
    regime_alignment_subscore: Mapped[float] = mapped_column(Float, default=10.0) # Max 10

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class OptimizationResult(Base):
    """Engine 8 — Portfolio Optimization Engine: Mean-variance / Sharpe results."""
    __tablename__ = "optimization_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    portfolio_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    initial_return: Mapped[float] = mapped_column(Float, default=0.10)
    optimized_return: Mapped[float] = mapped_column(Float, default=0.14)
    initial_risk: Mapped[float] = mapped_column(Float, default=0.18)
    optimized_risk: Mapped[float] = mapped_column(Float, default=0.14)

    initial_sharpe: Mapped[float] = mapped_column(Float, default=1.1)
    optimized_sharpe: Mapped[float] = mapped_column(Float, default=1.65)
    turnover_pct: Mapped[float] = mapped_column(Float, default=0.12)

    proposed_weights: Mapped[str] = mapped_column(Text, default="{}") # JSON {symbol: weight}
    optimized_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ScenarioSimulation(Base):
    """Engine 4 & 11 — Candidate portfolio simulations and What-If scenarios."""
    __tablename__ = "scenario_simulations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    portfolio_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    simulation_name: Mapped[str] = mapped_column(String(100), default="WHAT_IF_SCENARIO")

    source_asset: Mapped[str] = mapped_column(String(20), nullable=False)
    target_asset: Mapped[str] = mapped_column(String(20), nullable=False)
    reallocation_pct: Mapped[float] = mapped_column(Float, default=0.10)

    current_return: Mapped[float] = mapped_column(Float, default=0.12)
    simulated_return: Mapped[float] = mapped_column(Float, default=0.15)
    current_risk: Mapped[float] = mapped_column(Float, default=0.16)
    simulated_risk: Mapped[float] = mapped_column(Float, default=0.13)

    current_sharpe: Mapped[float] = mapped_column(Float, default=1.2)
    simulated_sharpe: Mapped[float] = mapped_column(Float, default=1.7)
    diversification_delta: Mapped[float] = mapped_column(Float, default=0.08)

    simulated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class PortfolioSnapshot(Base):
    """Snapshot table for tracking portfolio state before decision execution."""
    __tablename__ = "portfolio_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    portfolio_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    total_value: Mapped[float] = mapped_column(Float, default=100000.0)
    holdings_json: Mapped[str] = mapped_column(Text, default="[]") # JSON list of holdings
    snapshot_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
