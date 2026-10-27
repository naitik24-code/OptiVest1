import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.autonomous import (
    ScheduledJob, JobStatus, WorkerStatus, SystemHealth, Notification, NotificationType
)
from main import app
from app.db.session import engine, Base, SessionLocal
from app.dependencies.auth import require_admin

# Override auth for autonomous routes
app.dependency_overrides[require_admin] = lambda: None

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    # Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        # Rollback so we don't leak state between tests
        db.rollback()
        db.close()

def test_scheduler_status(setup_db, db_session: Session):
    response = client.get("/api/v1/autonomous/scheduler/status")
    if response.status_code != 200:
        print("FAILED STATUS:", response.status_code, response.text)
    assert response.status_code == 200
    assert "running" in response.json()
    assert "jobs" in response.json()

def test_run_job_not_found(setup_db, db_session: Session):
    response = client.post("/api/v1/autonomous/scheduler/job/999/run")
    assert response.status_code == 404

def test_pause_resume_job(setup_db, db_session: Session):
    # Setup job
    job = ScheduledJob(
        job_name=f"test_job_{uuid.uuid4()}", 
        schedule_interval="every_minute",
        target_function="test_target"
    )
    db_session.add(job)
    db_session.commit()
    
    # Pause
    response = client.post(f"/api/v1/autonomous/scheduler/job/{job.id}/pause")
    assert response.status_code == 200
    db_session.refresh(job)
    assert job.status == JobStatus.PAUSED
    
    # Resume
    response = client.post(f"/api/v1/autonomous/scheduler/job/{job.id}/resume")
    assert response.status_code == 200
    db_session.refresh(job)
    assert job.status == JobStatus.PENDING

def test_system_health(setup_db, db_session: Session):
    health = SystemHealth(
        component=f"DATABASE_{uuid.uuid4()}",
        status="HEALTHY"
    )
    db_session.add(health)
    db_session.commit()
    
    response = client.get("/api/v1/autonomous/system/health")
    assert response.status_code == 200
    data = response.json()
    assert "components" in data
    assert any(c["status"] == "HEALTHY" for c in data["components"])

def test_worker_status(setup_db, db_session: Session):
    test_worker_id = f"WORKER_TEST_{uuid.uuid4()}"
    worker = WorkerStatus(
        worker_id=test_worker_id,
        status="ACTIVE"
    )
    db_session.add(worker)
    db_session.commit()
    
    response = client.get("/api/v1/autonomous/workers/status")
    assert response.status_code == 200
    assert any(w["worker_id"] == test_worker_id for w in response.json())
