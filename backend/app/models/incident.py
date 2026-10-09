import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    incident_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    alert_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("alerts.id"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="open",
        index=True,
    )

    asset_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("assets.id"),
        nullable=True,
        index=True,
    )

    source_ip: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True,
    )

    username: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )