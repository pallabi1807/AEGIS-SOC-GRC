import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RiskCreate(BaseModel):
    title: str = Field(
        ...,
        description="Title of the identified risk.",
        examples=["Web Application Enumeration Risk"],
    )

    description: str = Field(
        ...,
        description="Detailed description of the risk.",
        examples=[
            "High-volume web enumeration activity detected against "
            "the AEGIS demo web application."
        ],
    )

    risk_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="AEGIS calculated risk score from 0 to 100.",
        examples=[79],
    )

    risk_level: str = Field(
        ...,
        description="Risk classification.",
        examples=["high"],
    )

    treatment: str = Field(
        default="mitigate",
        description="Risk treatment strategy.",
        examples=["mitigate"],
    )

    owner: str | None = Field(
        default=None,
        description="Person or team responsible for the risk.",
        examples=["SOC-GRC Team"],
    )

    incident_id: uuid.UUID | None = Field(
        default=None,
        description="Related security incident.",
    )

    asset_id: uuid.UUID | None = Field(
        default=None,
        description="Affected asset.",
    )


class RiskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    risk_number: str
    title: str
    description: str
    risk_score: int
    risk_level: str
    status: str
    treatment: str
    owner: str | None
    incident_id: uuid.UUID | None
    asset_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime