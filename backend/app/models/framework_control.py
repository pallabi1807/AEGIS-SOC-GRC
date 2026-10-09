import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    Text,
    Uuid,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class FrameworkControl(Base):
    __tablename__ = "framework_controls"

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

    requirement_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey(
            "compliance_requirements.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    control_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey(
            "controls.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    mapping_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="direct",
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="mapped",
    )

    rationale: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "requirement_id",
            "control_id",
            name="uq_requirement_control_mapping",
        ),
    )
