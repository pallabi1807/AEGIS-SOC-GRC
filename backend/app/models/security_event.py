import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    DateTime,
    Text,
    ForeignKey,
    Uuid,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    asset_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("assets.id"),
        nullable=True,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    source: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    event_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="low",
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    source_ip: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True,
    )

    username: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    raw_data: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )