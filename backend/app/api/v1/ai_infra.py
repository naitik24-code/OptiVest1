from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from app.db.session import get_db
from app.services.currency_service import CurrencyService
from app.services.providers.forex_provider import ForexProviderFactory
from app.services.ai_registry_service import AIRegistryService
from app.services.system_health_service import SystemHealthService

from app.dependencies.auth import require_admin

router = APIRouter(tags=["AI Infrastructure & Globalization"], dependencies=[Depends(require_admin)])


# =============================================================================
# MODULE 4 & 5: GLOBAL CURRENCY & FOREX DATA ENGINE APIs
# =============================================================================
@router.get("/currency/currencies")
def get_supported_currencies():
    """Module 4 & 5: Returns supported global currencies and exchange rate metadata."""
    return CurrencyService.get_supported_currencies()


@router.get("/currency/convert")
def convert_currency(
    amount: float = Query(..., gt=0),
    from_currency: str = Query(default="USD"),
    to_currency: str = Query(default="USD")
):
    """Module 4 & 5: Converts monetary amounts across global currencies."""
    return CurrencyService.convert_amount(amount, from_currency, to_currency)


@router.get("/currency/forex-providers")
def list_forex_providers():
    """Module 5: Returns available Forex provider abstraction layer implementations."""
    return {
        "active_provider": "ExchangeRate-API",
        "available_providers": ForexProviderFactory.list_available_providers()
    }


# =============================================================================
# MODULE 1: MODEL REGISTRY APIs
# =============================================================================
@router.get("/ai-infra/models")
def list_registered_models(db: Session = Depends(get_db)):
    """Module 1: List registered AI models."""
    service = AIRegistryService(db)
    return service.list_models()


@router.post("/ai-infra/models/register")
def register_ai_model(
    name: str = Query(...),
    algorithm: str = Query(...),
    description: str = Query(default=""),
    created_by: str = Query(default="AI_ENGINEERING_LEAD"),
    db: Session = Depends(get_db)
):
    """Module 1: Register new AI model in Model Registry."""
    service = AIRegistryService(db)
    return service.register_model(name, algorithm, description, created_by)


@router.get("/ai-infra/models/{model_id}/versions")
def get_model_versions(model_id: str, db: Session = Depends(get_db)):
    """Module 1: Get version history for a specific model."""
    service = AIRegistryService(db)
    return service.get_model_versions(model_id)


@router.post("/ai-infra/models/{model_id}/activate")
def activate_model_version(
    model_id: str,
    version: str = Query(...),
    db: Session = Depends(get_db)
):
    """Module 1: Activate model version."""
    service = AIRegistryService(db)
    res = service.activate_model_version(model_id, version)
    if not res:
        raise HTTPException(status_code=404, detail="Model version not found")
    return res


@router.post("/ai-infra/models/{model_id}/rollback")
def rollback_model_version(
    model_id: str,
    target_version: str = Query(...),
    db: Session = Depends(get_db)
):
    """Module 1: Rollback model version to a target release."""
    service = AIRegistryService(db)
    res = service.rollback_model_version(model_id, target_version)
    if not res:
        raise HTTPException(status_code=404, detail="Target model version not found")
    return res


@router.post("/ai-infra/models/{model_id}/archive")
def archive_model_version(
    model_id: str,
    version: str = Query(...),
    db: Session = Depends(get_db)
):
    """Module 1: Archive a specific model version."""
    service = AIRegistryService(db)
    res = service.archive_model_version(model_id, version)
    if not res:
        raise HTTPException(status_code=404, detail="Model version not found")
    return res


# =============================================================================
# MODULE 2: DATASET VERSIONING APIs
# =============================================================================
@router.get("/ai-infra/datasets")
def list_datasets(db: Session = Depends(get_db)):
    """Module 2: List dataset registry entries."""
    service = AIRegistryService(db)
    return service.list_datasets()


@router.post("/ai-infra/datasets/register")
def register_dataset_version(
    name: str = Query(...),
    version: str = Query(default="v1.0.0"),
    row_count: int = Query(default=1000),
    feature_count: int = Query(default=20),
    training_period: str = Query(default="2021-01-01 to 2025-12-31"),
    db: Session = Depends(get_db)
):
    """Module 2: Register dataset version with checksum and quality metadata."""
    service = AIRegistryService(db)
    return service.register_dataset_version(
        name=name,
        version=version,
        row_count=row_count,
        feature_count=feature_count,
        training_period=training_period
    )


@router.get("/ai-infra/datasets/versions")
def list_dataset_versions(dataset_id: Optional[str] = Query(default=None), db: Session = Depends(get_db)):
    """Module 2: Get dataset versions and lineage."""
    service = AIRegistryService(db)
    return service.list_dataset_versions(dataset_id)


# =============================================================================
# MODULE 6: DATASET SNAPSHOT ENGINE APIs
# =============================================================================
@router.get("/ai-infra/snapshots")
def list_dataset_snapshots(db: Session = Depends(get_db)):
    """Module 6: List immutable dataset snapshots."""
    service = AIRegistryService(db)
    return service.list_snapshots()


@router.post("/ai-infra/snapshots/create")
def create_dataset_snapshot(
    dataset_version: str = Query(default="v1.0.0"),
    feature_version: str = Query(default="v1.0.0"),
    db: Session = Depends(get_db)
):
    """Module 6: Create immutable dataset snapshot before AI training."""
    service = AIRegistryService(db)
    return service.create_dataset_snapshot(dataset_version, feature_version)


# =============================================================================
# MODULE 7: FEATURE VERSIONING APIs
# =============================================================================
@router.get("/ai-infra/features")
def list_feature_versions(db: Session = Depends(get_db)):
    """Module 7: List feature set versions and dependency lineage."""
    service = AIRegistryService(db)
    return service.list_feature_versions()


@router.post("/ai-infra/features/register")
def register_feature_version(
    feature_set_name: str = Query(...),
    feature_version: str = Query(default="v1.0.0"),
    calculation_version: str = Query(default="v1.0"),
    indicator_version: str = Query(default="v1.0"),
    dependencies: str = Query(default="OHLCV, SMA, RSI, MACD, Bollinger"),
    db: Session = Depends(get_db)
):
    """Module 7: Register engineered feature set version."""
    service = AIRegistryService(db)
    return service.register_feature_version(
        feature_set_name=feature_set_name,
        feature_version=feature_version,
        calculation_version=calculation_version,
        indicator_version=indicator_version,
        dependencies=dependencies
    )


# =============================================================================
# MODULE 3 & 10: EXPERIMENT TRACKING & REPRODUCIBILITY APIs
# =============================================================================
@router.get("/ai-infra/experiments")
def list_experiments(db: Session = Depends(get_db)):
    """Module 3 & 10: List tracked ML experiments."""
    service = AIRegistryService(db)
    return service.list_experiments()


@router.post("/ai-infra/experiments/record")
def record_experiment(
    name: str = Query(...),
    algorithm: str = Query(...),
    hyperparameters: str = Query(default='{"learning_rate": 0.001, "epochs": 100}'),
    dataset_version: str = Query(default="v1.0.0"),
    model_version: str = Query(default="v1.0.0"),
    feature_version: str = Query(default="v1.0.0"),
    random_seed: int = Query(default=42),
    notes: str = Query(default="Experiment run"),
    db: Session = Depends(get_db)
):
    """Module 3 & 10: Record new ML experiment run with seed & hyperparameters."""
    service = AIRegistryService(db)
    return service.record_experiment(
        name=name,
        algorithm=algorithm,
        hyperparameters=hyperparameters,
        dataset_version=dataset_version,
        model_version=model_version,
        feature_version=feature_version,
        random_seed=random_seed,
        notes=notes
    )


@router.get("/ai-infra/experiments/compare")
def compare_experiments(ids: str = Query(..., description="Comma-separated experiment IDs"), db: Session = Depends(get_db)):
    """Module 3: Compare ML experiments side by side."""
    service = AIRegistryService(db)
    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    return service.compare_experiments(id_list)


@router.get("/ai-infra/experiments/{experiment_id}/reproduce")
def get_reproducibility_manifest(experiment_id: str, db: Session = Depends(get_db)):
    """Module 10: Get full reproducibility manifest for experiment."""
    service = AIRegistryService(db)
    return service.get_reproducibility_manifest(experiment_id)


# =============================================================================
# MODULE 8: ML METADATA ENGINE APIs
# =============================================================================
@router.get("/ai-infra/metadata/summary")
def get_ml_metadata_summary(db: Session = Depends(get_db)):
    """Module 8: ML Metadata Repository summary and stats."""
    service = AIRegistryService(db)
    return service.get_metadata_summary()


# =============================================================================
# MODULE 9: SYSTEM HEALTH DASHBOARD APIs
# =============================================================================
@router.get("/ai-infra/health")
def get_system_health(db: Session = Depends(get_db)):
    """Module 9: Engineering System Health & Telemetry Dashboard."""
    return SystemHealthService.get_system_health(db)


# =============================================================================
# MODULE 1: AI CONFIGURATION ENGINE API
# =============================================================================
@router.get("/ai-infra/config")
def get_ai_configuration(config_name: str = Query(default="DEFAULT_CONFIG"), db: Session = Depends(get_db)):
    """Module 1: Get centralized AI configuration parameters."""
    service = AIRegistryService(db)
    return service.get_ai_config(config_name)


@router.post("/ai-infra/config")
def update_ai_configuration(
    prediction_horizon: Optional[str] = Query(default=None),
    prediction_frequency: Optional[str] = Query(default=None),
    confidence_threshold: Optional[float] = Query(default=None),
    min_training_samples: Optional[int] = Query(default=None),
    training_frequency: Optional[str] = Query(default=None),
    feature_selection_strategy: Optional[str] = Query(default=None),
    algorithm_selection: Optional[str] = Query(default=None),
    validation_split: Optional[float] = Query(default=None),
    test_split: Optional[float] = Query(default=None),
    early_stopping: Optional[bool] = Query(default=None),
    random_seed: Optional[int] = Query(default=None),
    gpu_enable_flag: Optional[bool] = Query(default=None),
    model_auto_deployment: Optional[bool] = Query(default=None),
    config_name: str = Query(default="DEFAULT_CONFIG"),
    db: Session = Depends(get_db)
):
    """Module 1: Update centralized AI configuration parameters."""
    service = AIRegistryService(db)
    return service.update_ai_config(
        config_name=config_name,
        prediction_horizon=prediction_horizon,
        prediction_frequency=prediction_frequency,
        confidence_threshold=confidence_threshold,
        min_training_samples=min_training_samples,
        training_frequency=training_frequency,
        feature_selection_strategy=feature_selection_strategy,
        algorithm_selection=algorithm_selection,
        validation_split=validation_split,
        test_split=test_split,
        early_stopping=early_stopping,
        random_seed=random_seed,
        gpu_enable_flag=gpu_enable_flag,
        model_auto_deployment=model_auto_deployment
    )


# =============================================================================
# MODULE 2: AI FEATURE IMPORTANCE REPOSITORY API
# =============================================================================
@router.get("/ai-infra/feature-importance")
def get_feature_importance(model_version: str = Query(default="v1.0.0"), db: Session = Depends(get_db)):
    """Module 2: Get Feature Importance scores and ranking for SHAP integration."""
    service = AIRegistryService(db)
    return service.get_feature_importance(model_version)


@router.post("/ai-infra/feature-importance/record")
def record_feature_importance(
    features: List[Dict[str, Any]],
    model_version: str = Query(default="v1.0.0"),
    dataset_version: str = Query(default="v1.0.0"),
    experiment_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    """Module 2: Store feature importance rankings."""
    service = AIRegistryService(db)
    return service.record_feature_importance(features, model_version, dataset_version, experiment_id)


# =============================================================================
# MODULE 3 & 10: AI TRAINING QUEUE & MLOPS ORCHESTRATION APIs
# =============================================================================
@router.get("/ai-infra/training-queue")
def list_training_queue(db: Session = Depends(get_db)):
    """Module 3 & 10: List training queue jobs and execution statuses."""
    service = AIRegistryService(db)
    return service.list_training_jobs()


@router.post("/ai-infra/training-queue/enqueue")
def enqueue_training_job(
    job_name: str = Query(...),
    job_type: str = Query(default="TRAINING"),
    algorithm: str = Query(default="LSTM"),
    dataset_version: str = Query(default="v1.0.0"),
    feature_version: str = Query(default="v1.0.0"),
    db: Session = Depends(get_db)
):
    """Module 3 & 10: Enqueue asynchronous AI training job."""
    service = AIRegistryService(db)
    return service.enqueue_training_job(job_name, job_type, algorithm, dataset_version, feature_version)


@router.get("/ai-infra/training-queue/{job_id}/logs")
def get_training_job_logs(job_id: str, db: Session = Depends(get_db)):
    """Module 3: Get job execution logs."""
    service = AIRegistryService(db)
    return service.get_training_job_logs(job_id)


@router.post("/ai-infra/training-queue/{job_id}/status")
def update_training_job_status(
    job_id: str,
    status: str = Query(...),
    progress_pct: float = Query(default=0.0),
    error_message: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    """Module 3: Update training job status and execution progress."""
    service = AIRegistryService(db)
    res = service.update_job_status(job_id, status, progress_pct, error_message)
    if not res:
        raise HTTPException(status_code=404, detail="Training job not found")
    return res


# =============================================================================
# MODULE 6: AI READINESS DASHBOARD API
# =============================================================================
@router.get("/ai-infra/readiness")
def get_ai_readiness_dashboard(db: Session = Depends(get_db)):
    """Module 6: Get comprehensive AI readiness & engineering metrics."""
    service = AIRegistryService(db)
    return service.get_ai_readiness_dashboard()


# =============================================================================
# MODULE 7: MODEL LIFECYCLE MANAGEMENT API
# =============================================================================
@router.post("/ai-infra/models/{model_id}/lifecycle/transition")
def transition_model_lifecycle(
    model_id: str,
    version: str = Query(...),
    to_state: str = Query(..., description="DRAFT, TRAINING, EVALUATING, VALIDATED, PRODUCTION, ARCHIVED, ROLLED_BACK"),
    reason: str = Query(default="State transition trigger"),
    db: Session = Depends(get_db)
):
    """Module 7: Execute model lifecycle state transition."""
    service = AIRegistryService(db)
    return service.transition_model_lifecycle(model_id, version, to_state, reason)


@router.get("/ai-infra/models/{model_id}/lifecycle/history")
def get_model_lifecycle_history(model_id: str, db: Session = Depends(get_db)):
    """Module 7: Get audit history for model lifecycle state transitions."""
    service = AIRegistryService(db)
    return service.get_model_lifecycle_history(model_id)


# =============================================================================
# MODULE 8: MODEL COMPARISON ENGINE API
# =============================================================================
@router.get("/ai-infra/models/compare")
def compare_model_versions(version_ids: str = Query(..., description="Comma separated model version IDs"), db: Session = Depends(get_db)):
    """Module 8: Compare metrics (Accuracy, Precision, Recall, RMSE, MAE, MAPE, Inference/Training Time)."""
    service = AIRegistryService(db)
    id_list = [v.strip() for v in version_ids.split(",") if v.strip()]
    return service.compare_models(id_list)


# =============================================================================
# MODULE 9: DATASET LINEAGE ENGINE API
# =============================================================================
@router.get("/ai-infra/lineage")
def get_dataset_lineage(db: Session = Depends(get_db)):
    """Module 9: Get complete dataset lineage graph."""
    service = AIRegistryService(db)
    return service.get_dataset_lineage()


@router.post("/ai-infra/lineage/record")
def add_dataset_lineage_node(
    node_name: str = Query(...),
    stage: str = Query(..., description="MARKET_DATA, CLEANING, VALIDATION, FEATURE_ENGINEERING, DATASET_SNAPSHOT, TRAINING, MODEL, PREDICTION"),
    source_node: str = Query(...),
    target_node: str = Query(...),
    transformation_metadata: str = Query(default="{}"),
    db: Session = Depends(get_db)
):
    """Module 9: Record dataset lineage node."""
    service = AIRegistryService(db)
    return service.add_dataset_lineage(node_name, stage, source_node, target_node, transformation_metadata)


# =============================================================================
# MODULE 10: MLOPS PREDICTION METADATA API
# =============================================================================
@router.post("/ai-infra/predictions/metadata")
def record_prediction_metadata(
    prediction_code: str = Query(...),
    model_version: str = Query(default="v1.0.0"),
    dataset_version: str = Query(default="v1.0.0"),
    feature_version: str = Query(default="v1.0.0"),
    snapshot_code: str = Query(default="SNAP-DEFAULT"),
    execution_time_ms: float = Query(default=2.5),
    db: Session = Depends(get_db)
):
    """Module 10: Record pre-prediction traceability metadata."""
    service = AIRegistryService(db)
    return service.record_prediction_metadata(
        prediction_code=prediction_code,
        model_version=model_version,
        dataset_version=dataset_version,
        feature_version=feature_version,
        snapshot_code=snapshot_code,
        execution_time_ms=execution_time_ms
    )

