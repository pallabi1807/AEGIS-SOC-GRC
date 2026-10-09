import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SecurityEventCreate(BaseModel):
    asset_id: uuid.UUID | None = None
    timestamp: datetime | None = None
    source: str
    event_type: str
    severity: str = "low"
    message: str
    source_ip: str | None = None
    username: str | None = None
    raw_data: dict | None = None


class SecurityEventResponse(BaseModel):
    id: uuid.UUID
    asset_id: uuid.UUID | None
    timestamp: datetime
    source: str
    event_type: str
    severity: str
    message: str
    source_ip: str | None
    username: str | None
    raw_data: dict | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)