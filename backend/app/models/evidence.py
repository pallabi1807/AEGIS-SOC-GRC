import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    evidence_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
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

    evidence_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    source: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pending",
    )

    control_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("controls.id"),
        nullable=False,
        index=True,
    )

    collected_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # ---------------------------------------------------------
    # Evidence legitimacy and integrity fields
    # ---------------------------------------------------------

    artifact_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    artifact_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    collection_method: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    sha256_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    integrity_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="unverified",
    )

    review_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pending",
    )

    reviewed_by: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )