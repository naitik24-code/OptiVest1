"""
Phase 5 — Enterprise AI Prediction Platform Database Models
Tables: trained_models, model_metrics, prediction_history, prediction_results,
        backtest_results, ensemble_models, hyperparameter_trials, walk_forward_results
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Text, Boolean, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class TrainedModel(Base):
    """Module 1 — Multi-Model Training Engine: Stores every trained model artifact."""
    __tablename__ = "trained_models"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    algorithm: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # LSTM, GRU, XGBOOST, LIGHTGBM, RANDOM_FOREST, EXTRA_TREES, LINEAR_REGRESSION
    version: Mapped[str] = mapped_column(String(30), nullable=False, default="v1.0.0")
    asset_symbol: Mapped[str] = mapped_column(String(20), nullable=True, index=True)
    prediction_horizon: Mapped[str] = mapped_column(String(30), nullable=False, default="5D")  # 1D, 5D, 10D, 20D, 30D
    target_variable: Mapped[str] = mapped_column(String(50), default="PRICE_DIRECTION_5D")
    feature_version: Mapped[str] = mapped_column(String(30), default="v1.0.0")
    dataset_version: Mapped[str] = mapped_column(String(30), default="v1.0.0")
    hyperparameters: Mapped[str] = mapped_column(Text, default="{}")           # JSON
    training_config: Mapped[str] = mapped_column(Text, default="{}")            # JSON
    status: Mapped[str] = mapped_column(String(30), default="TRAINING", index=True)  # TRAINING, TRAINED, EVALUATING, ACTIVE, ARCHIVED, FAILED
    is_champion: Mapped[bool] = mapped_column(Boolean, default=False, index=True)   # Best performer across all algorithms
    is_ensemble_member: Mapped[bool] = mapped_column(Boolean, default=False)
    training_duration_s: Mapped[float] = mapped_column(Float, default=0.0)
    inference_latency_ms: Mapped[float] = mapped_column(Float, default=0.0)
    artifact_path: Mapped[str] = mapped_column(String(500), nullable=True)           # Future: S3/GCS path
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    queue_id: Mapped[str] = mapped_column(String(36), nullable=True)                 # Links to training_queue.id
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    trained_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    metrics: Mapped[list["ModelMetric"]] = relationship("ModelMetric", back_populates="model", cascade="all, delete-orphan")


class ModelMetric(Base):
    """Module 5 — Model Evaluation Engine: Complete metric set per trained model."""
    __tablename__ = "model_metrics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("trained_models.id", ondelete="CASCADE"), nullable=False, index=True)
    evaluation_set: Mapped[str] = mapped_column(String(20), default="TEST")  # TRAIN, VALIDATION, TEST

    # Regression metrics
    rmse: Mapped[float] = mapped_column(Float, default=0.0)
    mae: Mapped[float] = mapped_column(Float, default=0.0)
    mape: Mapped[float] = mapped_column(Float, default=0.0)
    r_squared: Mapped[float] = mapped_column(Float, default=0.0)

    # Classification metrics (direction prediction)
    directional_accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    precision: Mapped[float] = mapped_column(Float, default=0.0)
    recall: Mapped[float] = mapped_column(Float, default=0.0)
    f1_score: Mapped[float] = mapped_column(Float, default=0.0)
    hit_ratio: Mapped[float] = mapped_column(Float, default=0.0)

    # Operational metrics
    prediction_latency_ms: Mapped[float] = mapped_column(Float, default=0.0)
    training_time_s: Mapped[float] = mapped_column(Float, default=0.0)
    sharpe_ratio: Mapped[float] = mapped_column(Float, default=0.0)
    max_drawdown: Mapped[float] = mapped_column(Float, default=0.0)
    annualized_return: Mapped[float] = mapped_column(Float, default=0.0)

    # Training curve snapshots (JSON arrays)
    train_loss_curve: Mapped[str] = mapped_column(Text, default="[]")      # JSON list of epoch losses
    val_loss_curve: Mapped[str] = mapped_column(Text, default="[]")
    feature_importance: Mapped[str] = mapped_column(Text, default="{}")    # JSON {feature: importance}

    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    model: Mapped["TrainedModel"] = relationship("TrainedModel", back_populates="metrics")


class PredictionHistory(Base):
    """Module 11 — Prediction History: Every prediction with outcome tracking."""
    __tablename__ = "prediction_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("trained_models.id", ondelete="SET NULL"), nullable=True, index=True)
    asset_symbol: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    algorithm: Mapped[str] = mapped_column(String(50), nullable=False)
    model_version: Mapped[str] = mapped_column(String(30), nullable=False)
    feature_version: Mapped[str] = mapped_column(String(30), default="v1.0.0")
    dataset_version: Mapped[str] = mapped_column(String(30), default="v1.0.0")
    prediction_horizon: Mapped[str] = mapped_column(String(30), nullable=False)

    # Prediction output (Module 8)
    predicted_return: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_direction: Mapped[str] = mapped_column(String(10), nullable=False)  # UP, DOWN, NEUTRAL
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    probability_up: Mapped[float] = mapped_column(Float, default=0.5)
    probability_down: Mapped[float] = mapped_column(Float, default=0.5)
    reason_code: Mapped[str] = mapped_column(String(200), nullable=True)

    # Actual outcome (filled in later)
    actual_return: Mapped[float] = mapped_column(Float, nullable=True)
    actual_direction: Mapped[str] = mapped_column(String(10), nullable=True)
    prediction_error: Mapped[float] = mapped_column(Float, nullable=True)
    outcome: Mapped[str] = mapped_column(String(20), nullable=True)  # CORRECT, INCORRECT, PARTIAL
    market_regime: Mapped[str] = mapped_column(String(50), nullable=True, default="SIDEWAYS_MARKET")

    prediction_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    resolution_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    ensemble_id: Mapped[str] = mapped_column(String(36), nullable=True)   # Links to ensemble_models.id if ensemble prediction


class PredictionResult(Base):
    """Module 8 — Prediction Engine: Structured prediction output record."""
    __tablename__ = "prediction_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    prediction_id: Mapped[str] = mapped_column(String(36), ForeignKey("prediction_history.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_symbol: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    # Detailed result breakdown
    expected_return_pct: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_interval_low: Mapped[float] = mapped_column(Float, default=0.0)
    confidence_interval_high: Mapped[float] = mapped_column(Float, default=0.0)
    volatility_estimate: Mapped[float] = mapped_column(Float, default=0.0)
    signal_strength: Mapped[float] = mapped_column(Float, default=0.0)       # 0–1
    model_agreement: Mapped[float] = mapped_column(Float, default=1.0)       # For ensemble: pct models agreeing
    contributing_features: Mapped[str] = mapped_column(Text, default="[]")   # JSON top-N features

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class BacktestResult(Base):
    """Module 9 — Backtesting Engine: Historical simulation results."""
    __tablename__ = "backtest_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("trained_models.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_symbol: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    backtest_period: Mapped[str] = mapped_column(String(30), nullable=False)  # 1M, 3M, 6M, 1Y, 5Y
    start_date: Mapped[str] = mapped_column(String(20), nullable=False)
    end_date: Mapped[str] = mapped_column(String(20), nullable=False)
    total_predictions: Mapped[int] = mapped_column(Integer, default=0)

    # Performance
    total_return_pct: Mapped[float] = mapped_column(Float, default=0.0)
    annualized_return_pct: Mapped[float] = mapped_column(Float, default=0.0)
    hit_ratio: Mapped[float] = mapped_column(Float, default=0.0)
    directional_accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    sharpe_ratio: Mapped[float] = mapped_column(Float, default=0.0)
    max_drawdown_pct: Mapped[float] = mapped_column(Float, default=0.0)
    rmse: Mapped[float] = mapped_column(Float, default=0.0)
    mae: Mapped[float] = mapped_column(Float, default=0.0)
    mape: Mapped[float] = mapped_column(Float, default=0.0)
    max_error: Mapped[float] = mapped_column(Float, default=0.0)
    win_rate: Mapped[float] = mapped_column(Float, default=0.0)
    profit_factor: Mapped[float] = mapped_column(Float, default=1.0)

    # Per-period breakdown (JSON)
    monthly_returns: Mapped[str] = mapped_column(Text, default="[]")
    equity_curve: Mapped[str] = mapped_column(Text, default="[]")
    prediction_vs_actual: Mapped[str] = mapped_column(Text, default="[]")   # JSON array of {date, predicted, actual}

    run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class EnsembleModel(Base):
    """Module 6 — Ensemble Engine: Weighted/voting/stacking ensembles."""
    __tablename__ = "ensemble_models"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True, index=True)
    ensemble_type: Mapped[str] = mapped_column(String(30), default="WEIGHTED_AVERAGE")  # WEIGHTED_AVERAGE, VOTING, STACKING
    member_model_ids: Mapped[str] = mapped_column(Text, nullable=False)                  # JSON list of trained_model ids
    member_weights: Mapped[str] = mapped_column(Text, default="{}")                      # JSON {model_id: weight}
    asset_symbol: Mapped[str] = mapped_column(String(20), nullable=True, index=True)
    prediction_horizon: Mapped[str] = mapped_column(String(30), default="5D")

    # Ensemble vs individual performance
    ensemble_directional_accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    best_individual_accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    improvement_pct: Mapped[float] = mapped_column(Float, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_champion: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)


class HyperparameterTrial(Base):
    """Module 4 — Hyperparameter Optimization: Stores every experiment trial."""
    __tablename__ = "hyperparameter_trials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    experiment_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    algorithm: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    search_strategy: Mapped[str] = mapped_column(String(30), default="RANDOM")  # GRID, RANDOM, OPTUNA
    trial_number: Mapped[int] = mapped_column(Integer, nullable=False)
    hyperparameters: Mapped[str] = mapped_column(Text, nullable=False)           # JSON
    objective_value: Mapped[float] = mapped_column(Float, default=0.0)          # Primary metric (e.g. val_loss)
    directional_accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    rmse: Mapped[float] = mapped_column(Float, default=0.0)
    training_time_s: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default="COMPLETED")         # RUNNING, COMPLETED, FAILED, PRUNED
    is_best: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class WalkForwardResult(Base):
    """Module 3 — Walk-Forward Validation Engine: Per-fold validation results."""
    __tablename__ = "walk_forward_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("trained_models.id", ondelete="CASCADE"), nullable=False, index=True)
    validation_type: Mapped[str] = mapped_column(String(30), default="WALK_FORWARD")  # ROLLING, EXPANDING, WALK_FORWARD
    fold_number: Mapped[int] = mapped_column(Integer, nullable=False)
    train_start: Mapped[str] = mapped_column(String(20), nullable=False)
    train_end: Mapped[str] = mapped_column(String(20), nullable=False)
    test_start: Mapped[str] = mapped_column(String(20), nullable=False)
    test_end: Mapped[str] = mapped_column(String(20), nullable=False)
    train_samples: Mapped[int] = mapped_column(Integer, default=0)
    test_samples: Mapped[int] = mapped_column(Integer, default=0)

    # Fold metrics
    rmse: Mapped[float] = mapped_column(Float, default=0.0)
    mae: Mapped[float] = mapped_column(Float, default=0.0)
    mape: Mapped[float] = mapped_column(Float, default=0.0)
    r_squared: Mapped[float] = mapped_column(Float, default=0.0)
    directional_accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    sharpe_ratio: Mapped[float] = mapped_column(Float, default=0.0)
    hit_ratio: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class MarketRegimeLog(Base):
    """Module 15 — Market Regime Detection Engine: Persistent regime logs."""
    __tablename__ = "market_regimes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    asset_symbol: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    regime: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # BULL_MARKET, BEAR_MARKET, SIDEWAYS_MARKET, HIGH_VOLATILITY, etc.
    regime_confidence: Mapped[float] = mapped_column(Float, default=0.8)
    volatility_annualized: Mapped[float] = mapped_column(Float, default=0.0)
    total_return_pct: Mapped[float] = mapped_column(Float, default=0.0)
    trend_slope: Mapped[float] = mapped_column(Float, default=0.0)
    sma_20_ratio: Mapped[float] = mapped_column(Float, default=1.0)
    recommended_algos: Mapped[str] = mapped_column(Text, default="[]")   # JSON list of algorithm names
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

