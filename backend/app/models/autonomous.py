from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.db.session import Base

class JobStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PAUSED = "PAUSED"
    CANCELLED = "CANCELLED"

class ScheduledJob(Base):
    __tablename__ = "scheduled_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_name = Column(String, index=True, unique=True, nullable=False)
    description = Column(String)
    schedule_interval = Column(String, nullable=False) # e.g., "every_minute", "every_hour", "daily"
    target_function = Column(String, nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING)
    last_run = Column(DateTime(timezone=True), nullable=True)
    next_run = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    retry_count = Column(Integer, default=3)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class JobHistory(Base):
    __tablename__ = "job_history"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("scheduled_jobs.id"), nullable=False)
    run_status = Column(Enum(JobStatus), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    logs = Column(Text, nullable=True)
    metrics = Column(JSON, nullable=True)

class WorkerStatus(Base):
    __tablename__ = "worker_status"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(String, index=True, unique=True, nullable=False)
    status = Column(String, default="ACTIVE") # ACTIVE, IDLE, OFFLINE
    current_job_id = Column(Integer, ForeignKey("scheduled_jobs.id"), nullable=True)
    cpu_usage = Column(Float, nullable=True)
    memory_usage = Column(Float, nullable=True)
    last_heartbeat = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class NotificationChannel(str, enum.Enum):
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"
    PUSH = "PUSH"

class NotificationType(str, enum.Enum):
    RECOMMENDATION_GENERATED = "RECOMMENDATION_GENERATED"
    RECOMMENDATION_UPDATED = "RECOMMENDATION_UPDATED"
    PREDICTION_CONFIDENCE_DROP = "PREDICTION_CONFIDENCE_DROP"
    MARKET_REGIME_CHANGE = "MARKET_REGIME_CHANGE"
    PORTFOLIO_RISK_INCREASE = "PORTFOLIO_RISK_INCREASE"
    PAPER_TRADE_COMPLETED = "PAPER_TRADE_COMPLETED"
    WEEKLY_SUMMARY = "WEEKLY_SUMMARY"
    DAILY_SUMMARY = "DAILY_SUMMARY"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True) # Nullable for system-wide
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    channel = Column(Enum(NotificationChannel), default=NotificationChannel.IN_APP)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class NotificationHistory(Base):
    __tablename__ = "notification_history"

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id"), nullable=False)
    delivery_status = Column(String, nullable=False) # SENT, FAILED, DELIVERED
    delivery_time = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

class SystemHealth(Base):
    __tablename__ = "autonomous_system_health"

    id = Column(Integer, primary_key=True, index=True)
    component = Column(String, index=True, nullable=False) # e.g., "SCHEDULER", "WORKER_1", "DATABASE"
    status = Column(String, nullable=False) # HEALTHY, DEGRADED, DOWN
    details = Column(JSON, nullable=True)
    last_checked = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class SchedulerLog(Base):
    __tablename__ = "scheduler_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False) # START, STOP, PAUSE, ERROR
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class EventStream(Base):
    __tablename__ = "event_stream"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True, nullable=False) # e.g., "PRICE_UPDATE", "PREDICTION_REFRESH"
    payload = Column(JSON, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class PredictionQueue(Base):
    __tablename__ = "prediction_queue"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)
    model_id = Column(Integer, nullable=True) # References TrainedModel/ModelRegistry
    status = Column(String, default="QUEUED") # QUEUED, PROCESSING, COMPLETED, FAILED
    priority = Column(Integer, default=0)
    queued_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)
