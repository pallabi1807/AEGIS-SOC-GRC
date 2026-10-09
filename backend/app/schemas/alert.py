import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


AlertStatus = Literal[
    "open",
    "investigating",
    "resolved",
]


class AlertResponse(BaseModel):
    id: uuid.UUID
    rule_id: str
    title: str
    description: str
    severity: str
    status: AlertStatus
    asset_id: uuid.UUID | None
    source_ip: str | None
    username: str | None
    event_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertStatusUpdate(BaseModel):
    status: AlertStatus