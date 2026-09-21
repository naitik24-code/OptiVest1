from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED, EVENT_JOB_ADDED, EVENT_JOB_REMOVED, EVENT_JOB_MODIFIED
import logging
from app.db.session import engine
from app.db.session import SessionLocal
from app.models.autonomous import SchedulerLog, JobStatus, JobHistory, ScheduledJob
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

jobstores = {
    'default': SQLAlchemyJobStore(engine=engine, tablename='apscheduler_jobs')
}

scheduler = AsyncIOScheduler(jobstores=jobstores, timezone="UTC")

def scheduler_listener(event):
    db = SessionLocal()
    try:
        event_type_str = ""
        message = ""
        if event.code == EVENT_JOB_ERROR:
            event_type_str = "ERROR"
            message = f"Job {event.job_id} failed with error: {event.exception}"
            # Update job history if needed (simplified)
        elif event.code == EVENT_JOB_EXECUTED:
            event_type_str = "SUCCESS"
            message = f"Job {event.job_id} executed successfully at {event.scheduled_run_time}"
        elif event.code == EVENT_JOB_ADDED:
            event_type_str = "ADDED"
            message = f"Job {event.job_id} added"
        elif event.code == EVENT_JOB_REMOVED:
            event_type_str = "REMOVED"
            message = f"Job {event.job_id} removed"
        
        if event_type_str:
            log_entry = SchedulerLog(
                event_type=event_type_str,
                message=message,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(log_entry)
            db.commit()
    except Exception as e:
        logger.error(f"Error in scheduler_listener: {e}")
    finally:
        db.close()

scheduler.add_listener(scheduler_listener, EVENT_JOB_ERROR | EVENT_JOB_EXECUTED | EVENT_JOB_ADDED | EVENT_JOB_REMOVED)

def start_scheduler():
    from app.services.autonomous_service import autonomous_orchestrator
    
    if not scheduler.running:
        # Register Core Autonomous Jobs
        scheduler.add_job(autonomous_orchestrator.run_market_regime_watcher, 'interval', minutes=15, id='market_regime_watcher', replace_existing=True)
        scheduler.add_job(autonomous_orchestrator.run_prediction_refresh, 'interval', hours=1, id='prediction_refresh', replace_existing=True)
        scheduler.add_job(autonomous_orchestrator.run_model_health_watcher, 'interval', hours=4, id='model_health_watcher', replace_existing=True)
        
        scheduler.start()
        logger.info("Scheduler started with autonomous jobs registered.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler shutdown")
