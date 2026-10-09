import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    timestamp: datetime
    actor: str
    action: str
    entity_type: str
    entity_id: str | None
    description: str
    old_value: str | None
    new_value: str | None
    source: str

    model_config = ConfigDict(
        from_attributes=True,
    )