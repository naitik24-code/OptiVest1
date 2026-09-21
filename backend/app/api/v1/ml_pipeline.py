"""
ML Pipeline API — Phase 5: ML Engine Initiation
RESTful endpoints for feature engineering, ML worker dispatch, and pipeline control.
"""
from typing import List
from fastapi import APIRouter, Depends, BackgroundTasks, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.feature_engineering_service import FeatureEngineeringService
from app.services.ml_worker_service import MLWorkerService
from app.services.ai_registry_service import AIRegistryService

from app.dependencies.auth import require_admin

router = APIRouter(dependencies=[Depends(require_admin)])


# =============================================================================
# FEATURE ENGINEERING PIPELINE ENDPOINTS
# =============================================================================

@router.get("/ml/features/schema")
def get_feature_schema(version: str = Query(default="v1.0.0")):
    """Return the full 37-feature schema for a given pipeline version."""
    return FeatureEngineeringService.get_feature_schema(version)


@router.get("/ml/features/ranking")
def get_feature_ranking(version: str = Query(default="v1.0.0")):
    """Return features ranked by SHAP importance score (descending)."""
    return FeatureEngineeringService.get_importance_ranking(version)


@router.get("/ml/features/source-breakdown")
def get_feature_source_breakdown(version: str = Query(default="v1.0.0")):
    """Return feature count breakdown by source category."""
    return FeatureEngineeringService.get_source_breakdown(version)


@router.get("/ml/features/pipelines")
def list_feature_pipelines():
    """List available feature pipeline versions."""
    return {"available_versions": FeatureEngineeringService.list_pipelines()}


# =============================================================================
# ML WORKER DISPATCH ENDPOINTS
# =============================================================================

@router.post("/ml/jobs/{job_id}/dispatch")
async def dispatch_training_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Dispatch an existing training queue job to the async ML worker pipeline.
    The worker drives the job through: PREPROCESSING → FEATURE_ENGINEERING →
    SEQUENCE_BUILDING → TRAINING → EVALUATING → FINALISING → COMPLETED.
    """
    service = AIRegistryService(db)
    jobs = service.list_training_jobs()
    job_ids = [j["id"] for j in jobs]

    if job_id not in job_ids:
        return {"error": f"Job {job_id} not found in training queue."}

    background_tasks.add_task(MLWorkerService.dispatch_job, job_id)
    return {
        "status": "DISPATCHED",
        "job_id": job_id,
        "message": "Training pipeline dispatched to async ML worker.",
        "pipeline_stages": [
            "PREPROCESSING",
            "FEATURE_ENGINEERING",
            "SEQUENCE_BUILDING",
            "TRAINING",
            "EVALUATING",
            "FINALISING",
        ],
    }


@router.post("/ml/jobs/enqueue-and-dispatch")
async def enqueue_and_dispatch(
    background_tasks: BackgroundTasks,
    job_name: str = Query(...),
    algorithm: str = Query(default="LSTM"),
    dataset_version: str = Query(default="v1.0.0"),
    feature_version: str = Query(default="v1.0.0"),
    db: Session = Depends(get_db),
):
    """
    One-shot: enqueue a new training job AND immediately dispatch it
    to the async ML worker pipeline.
    """
    service = AIRegistryService(db)
    job = service.enqueue_training_job(job_name, "TRAINING", algorithm, dataset_version, feature_version)
    background_tasks.add_task(MLWorkerService.dispatch_job, job["id"])
    return {
        "job": job,
        "dispatch_status": "DISPATCHED",
        "message": f"Job '{job_name}' enqueued and dispatched to ML worker pipeline.",
    }


# =============================================================================
# ML PIPELINE STATUS SUMMARY
# =============================================================================

@router.get("/ml/pipeline/status")
def get_pipeline_status(db: Session = Depends(get_db)):
    """Full ML pipeline dashboard summary combining queue, features, and readiness."""
    service = AIRegistryService(db)
    jobs = service.list_training_jobs()
    readiness = service.get_ai_readiness_dashboard()
    feature_schema = FeatureEngineeringService.get_feature_schema()
    source_breakdown = FeatureEngineeringService.get_source_breakdown()

    running = [j for j in jobs if j["status"] == "RUNNING"]
    completed = [j for j in jobs if j["status"] == "COMPLETED"]
    queued = [j for j in jobs if j["status"] in ("QUEUED", "PENDING")]
    failed = [j for j in jobs if j["status"] == "FAILED"]

    return {
        "pipeline_phase": "PHASE_5_ML_ENGINE_INITIATION",
        "worker_engine": "FASTAPI_BACKGROUND_TASKS",
        "readiness_score": readiness["ai_readiness_score"],
        "readiness_status": readiness["readiness_status"],
        "feature_pipeline": {
            "version": feature_schema["version"],
            "feature_count": feature_schema["feature_count"],
            "window_size": feature_schema["window_size"],
            "prediction_steps": feature_schema["prediction_steps"],
            "model_target": feature_schema["model_target"],
            "source_breakdown": source_breakdown["by_source"],
        },
        "queue_summary": {
            "total_jobs": len(jobs),
            "running": len(running),
            "completed": len(completed),
            "queued": len(queued),
            "failed": len(failed),
        },
        "active_jobs": running,
        "recent_completed": completed[-3:] if completed else [],
    }
