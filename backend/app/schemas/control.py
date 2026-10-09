import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ControlCreate(BaseModel):
    control_id: str = Field(
        ...,
        description="Unique AEGIS control identifier.",
        examples=["CTRL-WEB-004"],
    )

    name: str = Field(
        ...,
        description="Name of the security control.",
        examples=["Web Access Monitoring"],
    )

    description: str = Field(
        ...,
        description="Description of what the control is intended to achieve.",
        examples=[
            "Monitor web application access and identify suspicious "
            "enumeration and scanning activity."
        ],
    )

    control_type: str = Field(
        default="detective",
        description="Control type such as preventive, detective, or corrective.",
        examples=["detective"],
    )

    status: str = Field(
        default="planned",
        description="Current implementation status of the control.",
        examples=["planned"],
    )

    owner: str | None = Field(
        default=None,
        description="Person or team responsible for the control.",
        examples=["SOC-GRC Team"],
    )


class ControlResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    control_id: str
    name: str
    description: str
    control_type: str
    status: str
    owner: str | None
    created_at: datetime
    updated_at: datetime