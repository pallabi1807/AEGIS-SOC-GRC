from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field



class RemediationCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10, max_length=5000)
    status: str = "open"
    priority: str = "medium"
    risk_id: UUID | None = None
    control_id: UUID | None = None
    owner: str | None = None
    due_date: datetime | None = None


class RemediationStatusUpdate(BaseModel):
    status: str
    verification_status: str | None = None
    verification_notes: str | None = None


class RemediationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    remediation_number: str
    title: str
    description: str
    status: str
    priority: str
    risk_id: UUID | None
    control_id: UUID | None
    owner: str | None
    due_date: datetime | None
    completed_at: datetime | None
    verification_status: str
    verification_notes: str | None
    created_at: datetime
    updated_at: datetime