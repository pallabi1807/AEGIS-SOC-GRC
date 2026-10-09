import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ComplianceRequirement(Base):
    __tablename__ = "compliance_requirements"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    framework_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey(
            "compliance_frameworks.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    requirement_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="active",
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
