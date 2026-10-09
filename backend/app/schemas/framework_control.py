from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class FrameworkControlBase(BaseModel):
    framework_id: UUID
    requirement_id: UUID
    control_id: UUID
    mapping_type: str = "direct"
    status: str = "mapped"
    rationale: str | None = None


class FrameworkControlCreate(FrameworkControlBase):
    pass


class FrameworkControlResponse(FrameworkControlBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
