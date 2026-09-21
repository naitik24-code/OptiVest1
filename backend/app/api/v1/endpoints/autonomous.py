from fastapi import APIRouter, Depends, HTTPException, WebSocket
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.session import get_db
from app.dependencies.auth import require_admin, get_current_user

router = APIRouter(dependencies=[Depends(require_admin)])

@router.get("/scheduler/status")
def get_scheduler_status(db: Session = Depends(get_db)):
    """API: Scheduler Status"""
    jobs = db.query(ScheduledJob).all()
    return {
        "running": scheduler.running,
        "jobs_count": len(jobs),
        "jobs": [
            {
                "id": j.id,
                "name": j.job_name,
                "status": j.status,
                "interval": j.schedule_interval,
                "next_run": j.next_run
            } for j in jobs
        ]
    }

@router.post("/scheduler/job/{job_id}/run")
def run_job(job_id: int, db: Session = Depends(get_db)):
    """API: Run Job"""
    job = db.query(ScheduledJob).filter(ScheduledJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # In a real scenario, this would immediately trigger the apscheduler job
    job.status = JobStatus.RUNNING
    db.commit()
    return {"status": "Job execution triggered", "job": job.job_name}

@router.post("/scheduler/job/{job_id}/pause")
def pause_job(job_id: int, db: Session = Depends(get_db)):
    """API: Pause Job"""
    job = db.query(ScheduledJob).filter(ScheduledJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job.status = JobStatus.PAUSED
    job.is_active = False
    db.commit()
    return {"status": "Job paused", "job": job.job_name}

@router.post("/scheduler/job/{job_id}/resume")
def resume_job(job_id: int, db: Session = Depends(get_db)):
    """API: Resume Job"""
    job = db.query(ScheduledJob).filter(ScheduledJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job.status = JobStatus.PENDING
    job.is_active = True
    db.commit()
    return {"status": "Job resumed", "job": job.job_name}

@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """API: Notification Center"""
    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()
    return notifications

@router.get("/workers/status")
def get_worker_status(db: Session = Depends(get_db)):
    """API: Worker Status"""
    workers = db.query(WorkerStatus).all()
    return workers

@router.get("/system/health")
def get_system_health(db: Session = Depends(get_db)):
    """API: System Health"""
    service = AutonomousService(db)
    return service.get_system_health()

@router.get("/predictions/queue")
def get_prediction_queue(db: Session = Depends(get_db)):
    """API: Prediction Queue"""
    queue = db.query(PredictionQueue).all()
    return queue

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """API: WebSocket for real-time events"""
    await websocket_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming WebSocket messages if any
    except Exception as e:
        websocket_manager.disconnect(websocket, user_id)
