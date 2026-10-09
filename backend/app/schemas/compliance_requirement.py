from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RequirementBase(BaseModel):
    framework_id: UUID
    requirement_id: str
    title: str
    description: str | None = None
    category: str | None = None
    status: str = "active"


class RequirementCreate(RequirementBase):
    pass


class RequirementResponse(RequirementBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
