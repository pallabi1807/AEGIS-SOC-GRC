from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class FrameworkBase(BaseModel):
    code: str
    name: str
    version: str | None = None
    description: str | None = None
    status: str = "active"


class FrameworkCreate(FrameworkBase):
    pass


class FrameworkResponse(FrameworkBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class FrameworkOverview(BaseModel):
    id: UUID
    code: str
    name: str
    version: str | None
    total_requirements: int
    mapped_requirements: int
    mapped_controls: int
    verified_controls: int
    coverage_percentage: float
