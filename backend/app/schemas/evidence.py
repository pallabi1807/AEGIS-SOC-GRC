import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EvidenceCreate(BaseModel):
    evidence_number: str | None = Field(
        default=None,
        description="Optional human-readable evidence identifier.",
        examples=["EVID-000001"],
    )

    title: str = Field(
        ...,
        description="Title of the evidence.",
        examples=["Web Access Monitoring Configuration"],
    )

    description: str = Field(
        ...,
        description="Description of what the evidence demonstrates.",
        examples=[
            "Evidence showing that web access monitoring is configured "
            "for the AEGIS demo web application."
        ],
    )

    evidence_type: str = Field(
        ...,
        description="Type of evidence.",
        examples=[
            "configuration",
            "log",
            "screenshot",
            "report",
            "verification_record",
        ],
    )

    source: str = Field(
        ...,
        description="System or source from which the evidence was obtained.",
        examples=["AEGIS SOC"],
    )

    status: str = Field(
        default="pending",
        description="Current evidence collection status.",
        examples=["pending", "collected", "rejected"],
    )

    control_id: uuid.UUID = Field(
        ...,
        description="Control supported by this evidence.",
    )

    artifact_name: str | None = Field(
        default=None,
        description="Name of the collected evidence artifact.",
        examples=["mfa_configuration.json"],
    )

    collection_method: str | None = Field(
        default=None,
        description="Method used to collect the evidence.",
        examples=[
            "Configuration Export",
            "SIEM Query",
            "System Screenshot",
            "Analyst Observation",
        ],
    )

    sha256_hash: str | None = Field(
        default=None,
        min_length=64,
        max_length=64,
        description="SHA-256 hash of the evidence artifact.",
        examples=[
            "a8f3b2c4d5e6f7890123456789abcdef"
            "0123456789abcdef0123456789abcdef"
        ],
    )

    integrity_status: str = Field(
        default="unverified",
        description="Integrity verification state of the evidence.",
        examples=["unverified", "verified", "failed"],
    )

    review_status: str = Field(
        default="pending",
        description="Analyst review state.",
        examples=["pending", "accepted", "rejected"],
    )

    reviewed_by: str | None = Field(
        default=None,
        description="Analyst who reviewed the evidence.",
        examples=["SOC Analyst"],
    )

    reviewed_at: datetime | None = Field(
        default=None,
        description="Timestamp when the evidence was reviewed.",
    )


class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    evidence_number: str
    title: str
    description: str
    evidence_type: str
    source: str
    status: str
    control_id: uuid.UUID
    collected_at: datetime
    created_at: datetime

    artifact_name: str | None
    collection_method: str | None
    sha256_hash: str | None
    integrity_status: str
    review_status: str
    reviewed_by: str | None
    reviewed_at: datetime | None


class EvidenceIntegrityVerification(BaseModel):
    sha256_hash: str = Field(
        ...,
        min_length=64,
        max_length=64,
        description="SHA-256 hash calculated from the evidence artifact.",
        examples=[
            "189932162249d6c6fd6eb44802448015a79c8972827c4cf32f79bbaeb4afce4f"
        ],
    )