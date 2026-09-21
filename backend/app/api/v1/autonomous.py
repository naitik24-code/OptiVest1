from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from typing import Any, Dict, List
import asyncio
from datetime import datetime, timezone

from app.db.session import get_db
from app.services.autonomous_service import autonomous_orchestrator
from app.services.system_health_service import SystemHealthService
from app.core.websocket import websocket_manager
from app.core.event_bus import event_bus
from app.models.autonomous import ScheduledJob, WorkerStatus, JobStatus

from app.dependencies.auth import require_admin

router = APIRouter(dependencies=[Depends(require_admin)])


# ─── Autonomous Status & Event Stream ────────────────────────────────────────

@router.get("/status")
def get_autonomous_status(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get the overall health, active jobs, and event stream for the Autonomous Command Center."""
    return autonomous_orchestrator.get_system_status(db)


@router.post("/trigger/{job_name}")
async def trigger_autonomous_job(job_name: str, db: Session = Depends(get_db)):
    """Manually trigger an autonomous job for testing/verification."""
    if job_name == "market_regime":
        asyncio.ensure_future(autonomous_orchestrator.run_market_regime_watcher())
    elif job_name == "prediction_refresh":
        asyncio.ensure_future(autonomous_orchestrator.run_prediction_refresh())
    elif job_name == "health_watcher":
        asyncio.ensure_future(autonomous_orchestrator.run_model_health_watcher())
    elif job_name == "apde_analysis":
        await event_bus.publish("PortfolioChanged", {"trigger": "manual_override"})
    else:
        return {"error": "Unknown job name"}

    return {"status": "triggered", "job": job_name}


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Real-time websocket connection for frontend command center."""
    await websocket_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)


# ─── Scheduler Dashboard ─────────────────────────────────────────────────────

@router.get("/scheduler/status")
def get_scheduler_status(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Return all scheduled jobs with their status, interval, last/next run times."""
    jobs = db.query(ScheduledJob).all()
    return {
        "running": True,
        "job_count": len(jobs),
        "jobs": [
            {
                "id": j.id,
                "name": j.job_name,
                "description": j.description,
                "interval": j.schedule_interval,
                "status": j.status.value if hasattr(j.status, "value") else j.status,
                "last_run": j.last_run.isoformat() if j.last_run else None,
                "next_run": j.next_run.isoformat() if j.next_run else None,
                "is_active": j.is_active,
                "retry_count": j.retry_count,
            }
            for j in jobs
        ],
    }


@router.post("/scheduler/job/{job_id}/{action}")
def control_scheduler_job(job_id: int, action: str, db: Session = Depends(get_db)):
    """Pause, resume, or run a scheduled job by ID."""
    job = db.query(ScheduledJob).filter(ScheduledJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if action == "pause":
        job.status = JobStatus.PAUSED
        job.is_active = False
    elif action == "resume":
        job.status = JobStatus.PENDING
        job.is_active = True
    elif action == "run":
        job.status = JobStatus.RUNNING
        job.last_run = datetime.now(timezone.utc)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")

    db.commit()
    return {"status": "ok", "job_id": job_id, "action": action}


# ─── Background Workers ───────────────────────────────────────────────────────

@router.get("/workers/status")
def get_workers_status(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Return status of all registered background workers."""
    try:
        workers = db.query(WorkerStatus).all()
        if not workers:
            # Provide sensible defaults so the UI always has data to show
            return [
                {
                    "id": i + 1,
                    "worker_id": name,
                    "status": "IDLE",
                    "current_job_id": None,
                    "cpu_usage": 0.0,
                    "memory_usage": 0.0,
                    "last_heartbeat": datetime.now(timezone.utc).isoformat(),
                }
                for i, name in enumerate([
                    "APDE_WORKER_1", "ML_WORKER_1",
                    "MARKET_SYNC_WORKER", "PREDICTION_WORKER"
                ])
            ]
        return [
            {
                "id": w.id,
                "worker_id": w.worker_id,
                "status": w.status,
                "current_job_id": w.current_job_id,
                "cpu_usage": w.cpu_usage,
                "memory_usage": w.memory_usage,
                "last_heartbeat": w.last_heartbeat.isoformat() if w.last_heartbeat else None,
            }
            for w in workers
        ]
    except Exception as e:
        return []


# ─── System Health Alias ──────────────────────────────────────────────────────

@router.get("/system/health")
def get_system_health_alias(db: Session = Depends(get_db)):
    """Alias for /ai-infra/health — returns structured system telemetry including CPU/RAM."""
    return SystemHealthService.get_system_health(db)
