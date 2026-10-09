import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class IncidentActivityCreate(BaseModel):
    activity_type: str = Field(
        ...,
        description="Type of activity recorded for the incident.",
        examples=["investigation_started"],
    )

    message: str = Field(
        ...,
        description="Detailed description of the activity.",
        examples=[
            "SOC analyst started investigation of the detected web scanner activity."
        ],
    )

    actor: str = Field(
        default="analyst",
        description="User or system that performed the activity.",
        examples=["analyst"],
    )


class IncidentActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    incident_id: uuid.UUID
    activity_type: str
    message: str
    actor: str
    created_at: datetime