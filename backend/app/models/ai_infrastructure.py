import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class ModelRegistry(Base):
    """Module 1: Production AI Model Registry."""
    __tablename__ = "models"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True, unique=True)
    algorithm: Mapped[str] = mapped_column(String(50), nullable=False)  # LSTM, XGBOOST, TRANSFORMER, APDE_SCORER
    description: Mapped[str] = mapped_column(Text, nullable=True)
    current_version: Mapped[str] = mapped_column(String(30), default="v1.0.0")
    created_by: Mapped[str] = mapped_column(String(100), default="AI_ENGINEERING_LEAD")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class ModelVersion(Base):
    """Module 1: Model Versioning & Evaluation Metrics."""
    __tablename__ = "model_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    model_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("models.id", ondelete="CASCADE"), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    dataset_version: Mapped[str] = mapped_column(String(30), nullable=False)
    feature_set_version: Mapped[str] = mapped_column(String(30), nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    precision: Mapped[float] = mapped_column(Float, default=0.0)
    recall: Mapped[float] = mapped_column(Float, default=0.0)
    f1_score: Mapped[float] = mapped_column(Float, default=0.0)
    rmse: Mapped[float] = mapped_column(Float, default=0.0)
    mae: Mapped[float] = mapped_column(Float, default=0.0)
    mape: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(30), default="DRAFT")  # DRAFT, ACTIVE, ARCHIVED, ROLLED_BACK
    training_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class DatasetRegistry(Base):
    """Module 2: AI Training Dataset Registry."""
    __tablename__ = "datasets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True, unique=True)
    data_source: Mapped[str] = mapped_column(String(100), default="OPTIVEST_FEATURE_STORE")
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class DatasetVersion(Base):
    """Module 2: Dataset Version & Lineage."""
    __tablename__ = "dataset_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    dataset_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    feature_count: Mapped[int] = mapped_column(Integer, default=20)
    row_count: Mapped[int] = mapped_column(Integer, default=1000)
    training_period: Mapped[str] = mapped_column(String(50), default="2021-01-01 to 2025-12-31")
    validation_period: Mapped[str] = mapped_column(String(50), default="2026-01-01 to 2026-06-30")
    test_period: Mapped[str] = mapped_column(String(50), default="2026-07-01 to 2026-08-01")
    quality_score: Mapped[float] = mapped_column(Float, default=100.0)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256 Checksum
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class DatasetSnapshot(Base):
    """Module 6: Immutable Training Dataset Snapshots."""
    __tablename__ = "dataset_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    snapshot_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True, unique=True)
    dataset_version: Mapped[str] = mapped_column(String(30), nullable=False)
    feature_version: Mapped[str] = mapped_column(String(30), nullable=False)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class FeatureVersion(Base):
    """Module 7: Feature Engineering Versioning."""
    __tablename__ = "feature_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    feature_set_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    feature_version: Mapped[str] = mapped_column(String(30), nullable=False)
    calculation_version: Mapped[str] = mapped_column(String(30), default="v1.0")
    indicator_version: Mapped[str] = mapped_column(String(30), default="v1.0")
    dependencies: Mapped[str] = mapped_column(String(255), default="OHLCV, SMA, RSI, MACD, Bollinger")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class ExperimentTrack(Base):
    """Module 3 & 10: ML Experiment Tracking & Research Reproducibility."""
    __tablename__ = "experiments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    algorithm: Mapped[str] = mapped_column(String(50), nullable=False)
    hyperparameters: Mapped[str] = mapped_column(Text, nullable=False)  # JSON string
    random_seed: Mapped[int] = mapped_column(Integer, default=42)
    dataset_version: Mapped[str] = mapped_column(String(30), nullable=False)
    model_version: Mapped[str] = mapped_column(String(30), nullable=False)
    feature_version: Mapped[str] = mapped_column(String(30), nullable=False)
    git_commit_hash: Mapped[str] = mapped_column(String(40), default="a1e76c4f03eb")
    training_time_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="COMPLETED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class ExperimentMetric(Base):
    """Module 3: ML Experiment Tracking Metrics."""
    __tablename__ = "experiment_metrics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    experiment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_name: Mapped[str] = mapped_column(String(50), nullable=False)
    metric_value: Mapped[float] = mapped_column(Float, nullable=False)
    step: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)



class Currency(Base):
    """Module 4: Enterprise Currency Master."""
    __tablename__ = "currencies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    code: Mapped[str] = mapped_column(String(10), nullable=False, unique=True, index=True)  # USD, INR, EUR, GBP, JPY, AUD, CAD, CHF, SGD, HKD
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    symbol: Mapped[str] = mapped_column(String(10), nullable=False)  # $, ₹, €, £, ¥
    is_base: Mapped[bool] = mapped_column(Boolean, default=False)


class ExchangeRate(Base):
    """Module 4 & 5: Global Forex Exchange Rates."""
    __tablename__ = "exchange_rates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    base_currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    target_currency: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    rate: Mapped[float] = mapped_column(Float, nullable=False)  # Rate to convert 1 USD -> Target
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class SystemHealthMetric(Base):
    """Module 9: Engineering System Health Dashboard Telemetry."""
    __tablename__ = "system_health"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    component: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="HEALTHY")
    latency_ms: Mapped[float] = mapped_column(Float, default=0.0)
    details: Mapped[str] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class AIConfiguration(Base):
    """Module 1: Centralized AI Configuration Engine Parameters."""
    __tablename__ = "ai_configurations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    config_name: Mapped[str] = mapped_column(String(100), default="DEFAULT_CONFIG", unique=True, index=True, nullable=False)
    prediction_horizon: Mapped[str] = mapped_column(String(20), default="30 Days", nullable=False)  # 1 Day, 5 Days, 30 Days, 90 Days, 180 Days, 365 Days
    prediction_frequency: Mapped[str] = mapped_column(String(20), default="DAILY", nullable=False)
    confidence_threshold: Mapped[float] = mapped_column(Float, default=0.85, nullable=False)
    min_training_samples: Mapped[int] = mapped_column(Integer, default=1000, nullable=False)
    training_frequency: Mapped[str] = mapped_column(String(20), default="WEEKLY", nullable=False)
    feature_selection_strategy: Mapped[str] = mapped_column(String(50), default="SHAP_TOP_K", nullable=False)
    algorithm_selection: Mapped[str] = mapped_column(String(50), default="LSTM", nullable=False)
    validation_split: Mapped[float] = mapped_column(Float, default=0.15, nullable=False)
    test_split: Mapped[float] = mapped_column(Float, default=0.15, nullable=False)
    early_stopping: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    random_seed: Mapped[int] = mapped_column(Integer, default=42, nullable=False)
    gpu_enable_flag: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    model_auto_deployment: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    updated_by: Mapped[str] = mapped_column(String(100), default="CHIEF_AI_ARCHITECT")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class FeatureImportance(Base):
    """Module 2: AI Feature Importance Repository."""
    __tablename__ = "feature_importance"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    feature_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    importance_score: Mapped[float] = mapped_column(Float, nullable=False)
    model_version: Mapped[str] = mapped_column(String(30), default="v1.0.0", index=True)
    dataset_version: Mapped[str] = mapped_column(String(30), default="v1.0.0")
    experiment_id: Mapped[str] = mapped_column(String(100), nullable=True)
    ranking: Mapped[int] = mapped_column(Integer, default=1)
    normalized_importance: Mapped[float] = mapped_column(Float, default=1.0)
    calculation_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class TrainingQueue(Base):
    """Module 3 & Module 10: Asynchronous Training Queue & MLOps Orchestrator."""
    __tablename__ = "training_queue"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    job_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    job_type: Mapped[str] = mapped_column(String(50), default="TRAINING")  # TRAINING, INFERENCE, EVALUATION, RETRAINING
    algorithm: Mapped[str] = mapped_column(String(50), default="LSTM")
    dataset_version: Mapped[str] = mapped_column(String(30), default="v1.0.0")
    feature_version: Mapped[str] = mapped_column(String(30), default="v1.0.0")
    status: Mapped[str] = mapped_column(String(30), default="PENDING", index=True)  # PENDING, QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    max_retries: Mapped[int] = mapped_column(Integer, default=3)
    worker_id: Mapped[str] = mapped_column(String(100), default="WORKER_01")
    progress_pct: Mapped[float] = mapped_column(Float, default=0.0)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)


class TrainingLog(Base):
    """Module 3: Asynchronous Training Job Logs."""
    __tablename__ = "training_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    queue_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("training_queue.id", ondelete="CASCADE"), nullable=False, index=True)
    log_level: Mapped[str] = mapped_column(String(20), default="INFO")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class PortfolioCurrency(Base):
    """Module 4 & 5: Portfolio Base Currency & Multi-Currency Engine."""
    __tablename__ = "portfolio_currency"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    portfolio_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    base_currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)  # USD, INR, EUR, GBP, JPY, etc.
    is_multi_exchange: Mapped[bool] = mapped_column(Boolean, default=True)
    exchange_rate_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class ModelLifecycle(Base):
    """Module 7: Model Lifecycle Management & Transition Audit Log."""
    __tablename__ = "model_lifecycle"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    model_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("models.id", ondelete="CASCADE"), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(30), nullable=False)
    from_state: Mapped[str] = mapped_column(String(30), nullable=False)  # DRAFT, TRAINING, EVALUATING, VALIDATED, PRODUCTION, ARCHIVED, ROLLED_BACK
    to_state: Mapped[str] = mapped_column(String(30), nullable=False)
    transition_reason: Mapped[str] = mapped_column(Text, nullable=True)
    triggered_by: Mapped[str] = mapped_column(String(100), default="SYSTEM_ORCHESTRATOR")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class DatasetLineage(Base):
    """Module 9: End-to-End Dataset Lineage Graph."""
    __tablename__ = "dataset_lineage"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    node_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    stage: Mapped[str] = mapped_column(String(50), nullable=False)  # MARKET_DATA, CLEANING, VALIDATION, FEATURE_ENGINEERING, DATASET_SNAPSHOT, TRAINING, MODEL, PREDICTION
    source_node: Mapped[str] = mapped_column(String(100), nullable=False)
    target_node: Mapped[str] = mapped_column(String(100), nullable=False)
    transformation_metadata: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class PredictionMetadata(Base):
    """Module 10: Pre-Prediction Traceability & MLOps Metadata Storage."""
    __tablename__ = "prediction_metadata"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    prediction_code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    model_version: Mapped[str] = mapped_column(String(30), nullable=False)
    dataset_version: Mapped[str] = mapped_column(String(30), nullable=False)
    feature_version: Mapped[str] = mapped_column(String(30), nullable=False)
    snapshot_code: Mapped[str] = mapped_column(String(50), nullable=False)
    git_commit_hash: Mapped[str] = mapped_column(String(40), default="a1e76c4f03eb")
    execution_time_ms: Mapped[float] = mapped_column(Float, default=0.0)
    metadata_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

