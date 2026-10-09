import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Risk(Base):
    __tablename__ = "risks"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    risk_number: Mapped[str] = mapped_column(
        String(30),
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

    risk_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    risk_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="open",
    )

    treatment: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="mitigate",
    )

    owner: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    incident_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("incidents.id"),
        nullable=True,
        index=True,
    )

    asset_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("assets.id"),
        nullable=True,
        index=True,
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