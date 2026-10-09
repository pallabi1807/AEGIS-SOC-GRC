import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    actor: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="system",
        index=True,
    )

    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    entity_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    entity_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    old_value: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    new_value: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    source: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="system",
        index=True,
    )