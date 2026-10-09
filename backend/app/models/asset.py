import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    hostname: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    ip_address: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True,
    )

    operating_system: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    asset_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="endpoint",
    )

    criticality: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="medium",
    )

    owner: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="active",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )