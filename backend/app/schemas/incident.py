import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    incident_number: str
    alert_id: uuid.UUID

    title: str
    description: str
    severity: str
    status: str

    asset_id: uuid.UUID | None = None
    source_ip: str | None = None
    username: str | None = None

    created_at: datetime
    updated_at: datetime


class IncidentStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        description="New incident status.",
        examples=["investigating"],
    )

    actor: str = Field(
        default="analyst",
        description="User or system performing the status change.",
        examples=["analyst"],
    )