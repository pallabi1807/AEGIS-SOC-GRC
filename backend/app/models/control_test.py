import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ControlTest(Base):
    __tablename__ = "control_tests"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    test_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    control_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("controls.id"),
        nullable=False,
        index=True,
    )

    evidence_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("evidence.id"),
        nullable=False,
        index=True,
    )

    test_procedure: Mapped[str] = mapped_column(
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

    tester: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="analyst",
    )

    tested_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )