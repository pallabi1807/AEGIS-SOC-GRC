from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ControlTestCreate(BaseModel):
    control_id: UUID
    evidence_id: UUID
    test_procedure: str = Field(
        ...,
        min_length=10,
        max_length=5000,
    )
    result: str = Field(
        ...,
        pattern="^(PASS|FAIL|PARTIAL)$",
    )
    findings: str | None = Field(
        default=None,
        max_length=5000,
    )
    tester: str = Field(
        default="analyst",
        max_length=255,
    )
    notes: str | None = Field(
        default=None,
        max_length=5000,
    )


class ControlTestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    test_number: str
    control_id: UUID
    evidence_id: UUID
    test_procedure: str
    result: str
    findings: str | None
    tester: str
    tested_at: datetime
    notes: str | None
    created_at: datetime