import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RiskControl(Base):
    __tablename__ = "risk_controls"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    risk_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("risks.id"),
        nullable=False,
        index=True,
    )

    control_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("controls.id"),
        nullable=False,
        index=True,
    )

    relationship: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="mitigates",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )