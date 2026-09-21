import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class DecisionAudit(Base):
    __tablename__ = "decision_audits"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    decision_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("decisions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    base_value: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )
    r_hat: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )
    shap_values: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        nullable=False
    )
    narrative: Mapped[str] = mapped_column(
        String,
        nullable=True
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    decision = relationship("Decision", back_populates="audit")
