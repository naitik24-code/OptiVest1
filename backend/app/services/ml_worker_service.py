"""
ML Worker Service — Phase 5: ML Engine Initiation
Asynchronous training job processor that uses FastAPI BackgroundTasks.

Simulates the full training pipeline stages:
  QUEUED → PREPROCESSING → FEATURE_ENGINEERING → TRAINING → EVALUATING → COMPLETED

This is the worker backbone — actual TF/PyTorch model code slots in at
the TRAINING stage once the full ML engine is ready (Phase 6).
"""
import asyncio
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.ai_infrastructure import TrainingQueue, TrainingLog

logger = logging.getLogger("optivest.ml_worker")




def _log_job(db: Session, job_id, level: str, message: str) -> None:
    """Append a structured log entry to the training_logs table."""
    entry = TrainingLog(
        queue_id=job_id,
        log_level=level,
        message=message,
    )
    db.add(entry)
    db.commit()


def _update_job(
    db: Session,
    job: TrainingQueue,
    status: str,
    progress: float,
    error: Optional[str] = None,
) -> None:
    job.status = status
    job.progress_pct = round(progress, 1)
    if error:
        job.error_message = error
    if status == "RUNNING" and job.started_at is None:
        job.started_at = datetime.now(timezone.utc)
    elif status in ("COMPLETED", "FAILED", "CANCELLED"):
        job.completed_at = datetime.now(timezone.utc)
    db.commit()


async def execute_training_pipeline(job_id: str) -> None:
    """
    Background coroutine that executes real model training pipeline.
    """
    db: Session = SessionLocal()
    try:
        parsed_id = uuid.UUID(job_id) if isinstance(job_id, str) else job_id
        job = db.query(TrainingQueue).filter(TrainingQueue.id == parsed_id).first()

        if not job:
            logger.error(f"[WORKER] Job {job_id} not found in queue — aborting.")
            return

        logger.info(f"[WORKER] Dispatching real model training for job '{job.job_name}' ({job.algorithm})")
        from app.services.multi_model_trainer import execute_model_training
        
        await execute_model_training(
            queue_id=str(job.id),
            algorithm=job.algorithm,
            asset_symbol=getattr(job, "asset_symbol", "AAPL") or "AAPL",
            prediction_horizon=getattr(job, "prediction_horizon", "5D") or "5D",
            dataset_version=job.dataset_version or "v1.0.0",
            feature_version=job.feature_version or "v1.0.0"
        )
    except Exception as exc:
        logger.exception(f"[WORKER] Job {job_id} raised an exception: {exc}")
        try:
            job = db.query(TrainingQueue).filter(TrainingQueue.id == parsed_id).first()
            if job:
                _update_job(db, job, "FAILED", job.progress_pct, str(exc))
                _log_job(db, job.id, "ERROR", f"Pipeline failed: {exc}")
        except Exception:
            pass
    finally:
        db.close()


class MLWorkerService:
    """
    Entry point consumed by the API layer.
    Wraps `execute_training_pipeline` and returns enqueue metadata.
    """

    @staticmethod
    async def dispatch_job(job_id: str) -> None:
        """Fire-and-forget dispatcher — called inside FastAPI BackgroundTasks."""
        await execute_training_pipeline(job_id)
