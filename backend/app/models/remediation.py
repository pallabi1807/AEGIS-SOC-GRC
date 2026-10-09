import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Remediation(Base):
    __tablename__ = "remediations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    remediation_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
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

    status: Mapped[str] = mapped_column(
        String(30),
        default="open",
        nullable=False,
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        default="medium",
        nullable=False,
    )

    risk_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("risks.id"),
        nullable=True,
        index=True,
    )

    control_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("controls.id"),
        nullable=True,
        index=True,
    )

    owner: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    due_date: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    verification_status: Mapped[str] = mapped_column(
        String(30),
        default="not_verified",
        nullable=False,
    )

    verification_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )