import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class IncidentEnrichmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    incident_id: uuid.UUID

    related_event_count: int
    related_event_ids: list
    iocs: list

    mitre_techniques: list
    recommended_controls: list

    risk_score: int
    risk_level: str

    enrichment_version: str
    generated_at: datetime