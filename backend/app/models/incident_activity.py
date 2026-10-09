import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class IncidentActivity(Base):
    __tablename__ = "incident_activities"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    incident_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("incidents.id"),
        nullable=False,
        index=True,
    )

    activity_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    actor: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="system",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )