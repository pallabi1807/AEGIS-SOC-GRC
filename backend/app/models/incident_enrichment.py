import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class IncidentEnrichment(Base):
    __tablename__ = "incident_enrichments"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    incident_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("incidents.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    related_event_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    related_event_ids: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    iocs: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    mitre_techniques: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    recommended_controls: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    risk_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    risk_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="low",
    )

    enrichment_version: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="1.0",
    )

    generated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )