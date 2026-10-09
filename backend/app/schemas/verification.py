from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class VerificationCreate(BaseModel):
    remediation_id: UUID
    control_id: UUID
    verification_procedure: str = Field(
        min_length=10,
        max_length=5000,
    )
    result: str = Field(
        pattern="^(PASS|FAIL|PARTIAL)$"
    )
    findings: str | None = Field(
        default=None,
        max_length=5000,
    )
    verifier: str = "analyst"
    notes: str | None = Field(
        default=None,
        max_length=5000,
    )


class VerificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    verification_number: str
    remediation_id: UUID
    control_id: UUID
    verification_procedure: str
    result: str
    findings: str | None
    verifier: str
    verified_at: datetime
    notes: str | None
    created_at: datetime