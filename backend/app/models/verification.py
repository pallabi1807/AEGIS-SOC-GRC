import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Verification(Base):
    __tablename__ = "verifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    verification_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
    )

    remediation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("remediations.id"),
        nullable=False,
        index=True,
    )

    control_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("controls.id"),
        nullable=False,
        index=True,
    )

    verification_procedure: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    result: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    findings: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    verifier: Mapped[str] = mapped_column(
        String(100),
        default="analyst",
        nullable=False,
    )

    verified_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )