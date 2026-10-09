import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AssetCreate(BaseModel):
    hostname: str
    ip_address: str | None = None
    operating_system: str | None = None
    asset_type: str = "endpoint"
    criticality: str = "medium"
    owner: str | None = None
    status: str = "active"


class AssetAutoRegister(BaseModel):
    """
    Schema used by automated asset discovery/registration.
    """

    hostname: str
    ip_address: str | None = None
    operating_system: str | None = None
    asset_type: str = "endpoint"
    criticality: str = "medium"
    owner: str | None = None


class AssetResponse(BaseModel):
    id: uuid.UUID
    hostname: str
    ip_address: str | None
    operating_system: str | None
    asset_type: str
    criticality: str
    owner: str | None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)