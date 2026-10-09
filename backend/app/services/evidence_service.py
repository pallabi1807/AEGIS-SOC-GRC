import hashlib
import re
from datetime import datetime
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.control import Control
from app.models.evidence import Evidence

SHA256_PATTERN = re.compile(r"^[a-fA-F0-9]{64}$")


def generate_evidence_number(db: Session) -> str:
    count = db.query(Evidence).count()
    return f"EVID-{count + 1:06d}"


# ADD create_evidence() HERE
def create_evidence(
    db: Session,
    title: str,
    description: str,
    evidence_type: str,
    source: str,
    control_id: UUID,
    status: str = "pending",
    evidence_number: str | None = None,
    artifact_name: str | None = None,
    collection_method: str | None = None,
    sha256_hash: str | None = None,
    integrity_status: str = "unverified",
    review_status: str = "pending",
    reviewed_by: str | None = None,
    reviewed_at: datetime | None = None,
):
    allowed_statuses = {
        "pending",
        "collected",
        "rejected",
    }

    allowed_integrity_statuses = {
        "unverified",
        "verified",
        "failed",
    }

    allowed_review_statuses = {
        "pending",
        "accepted",
        "rejected",
    }

    if status not in allowed_statuses:
        raise ValueError(
            f"Invalid evidence status: {status}"
        )

    if integrity_status not in allowed_integrity_statuses:
        raise ValueError(
            f"Invalid integrity status: {integrity_status}"
        )

    if review_status not in allowed_review_statuses:
        raise ValueError(
            f"Invalid review status: {review_status}"
        )

    control = (
        db.query(Control)
        .filter(Control.id == control_id)
        .first()
    )

    if not control:
        raise ValueError("Control not found.")

    if evidence_number:
        existing = (
            db.query(Evidence)
            .filter(
                Evidence.evidence_number == evidence_number
            )
            .first()
        )

        if existing:
            return existing, False

    if not evidence_number:
        evidence_number = generate_evidence_number(db)

    if status == "collected":

        if not artifact_name:
            raise ValueError(
                "Collected evidence requires an artifact name."
            )

        if not collection_method:
            raise ValueError(
                "Collected evidence requires a collection method."
            )

        if not sha256_hash:
            raise ValueError(
                "Collected evidence requires a SHA-256 hash."
            )

        if not SHA256_PATTERN.fullmatch(sha256_hash):
            raise ValueError(
                "SHA-256 hash must contain exactly "
                "64 hexadecimal characters."
            )

    if review_status == "accepted":

        if status != "collected":
            raise ValueError(
                "Evidence must be collected before acceptance."
            )

        if integrity_status != "verified":
            raise ValueError(
                "Evidence integrity must be verified "
                "before acceptance."
            )

        if not reviewed_by:
            raise ValueError(
                "Accepted evidence requires a reviewer."
            )

        if not reviewed_at:
            reviewed_at = datetime.utcnow()

    evidence = Evidence(
        evidence_number=evidence_number,
        title=title,
        description=description,
        evidence_type=evidence_type,
        source=source,
        status=status,
        control_id=control_id,
        artifact_name=artifact_name,
        collection_method=collection_method,
        sha256_hash=(
            sha256_hash.lower()
            if sha256_hash
            else None
        ),
        integrity_status=integrity_status,
        review_status=review_status,
        reviewed_by=reviewed_by,
        reviewed_at=reviewed_at,
    )

    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    return evidence, True


def collect_evidence_artifact(
    db: Session,
    evidence_id: UUID,
    artifact_name: str,
    artifact_content: bytes,
):
    """
    Store an evidence artifact and calculate its SHA-256 hash
    from the actual artifact content.
    """

    evidence = (
        db.query(Evidence)
        .filter(Evidence.id == evidence_id)
        .first()
    )

    if not evidence:
        raise ValueError("Evidence not found.")

    if not artifact_name:
        raise ValueError("Artifact name is required.")

    if not artifact_content:
        raise ValueError("Evidence artifact cannot be empty.")

    evidence_dir = Path("evidence_artifacts")
    evidence_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(artifact_name).name
    artifact_path = evidence_dir / f"{evidence.evidence_number}_{safe_name}"

    artifact_path.write_bytes(artifact_content)

    sha256_hash = hashlib.sha256(
        artifact_content
    ).hexdigest()

    evidence.artifact_name = safe_name
    evidence.artifact_path = str(artifact_path)
    evidence.collection_method = "AEGIS artifact upload"
    evidence.sha256_hash = sha256_hash
    evidence.status = "collected"
    evidence.integrity_status = "unverified"
    evidence.review_status = "pending"

    db.commit()
    db.refresh(evidence)

    return evidence
def verify_evidence_integrity(
    db: Session,
    evidence_id: UUID,
):
    """
    Recalculate the SHA-256 hash from the stored artifact
    and compare it with the recorded evidence hash.
    """

    evidence = (
        db.query(Evidence)
        .filter(Evidence.id == evidence_id)
        .first()
    )

    if not evidence:
        raise ValueError("Evidence not found.")

    if evidence.status != "collected":
        raise ValueError(
            "Only collected evidence can undergo integrity verification."
        )

    if not evidence.artifact_path:
        raise ValueError(
            "Evidence artifact path is missing."
        )

    if not evidence.sha256_hash:
        raise ValueError(
            "Evidence SHA-256 hash is missing."
        )

    artifact_path = Path(evidence.artifact_path)

    if not artifact_path.exists():
        raise ValueError(
            "Evidence artifact file could not be found."
        )

    sha256 = hashlib.sha256()

    with artifact_path.open("rb") as artifact_file:
        for chunk in iter(lambda: artifact_file.read(1024 * 1024), b""):
            sha256.update(chunk)

    calculated_hash = sha256.hexdigest()

    if calculated_hash.lower() != evidence.sha256_hash.lower():
        evidence.integrity_status = "failed"

        db.commit()
        db.refresh(evidence)

        raise ValueError(
            "Evidence integrity verification failed: "
            "artifact hash does not match the recorded SHA-256 hash."
        )

    evidence.integrity_status = "verified"

    db.commit()
    db.refresh(evidence)

    return evidence


def review_evidence(
    db: Session,
    evidence_id: UUID,
    review_status: str,
    reviewed_by: str,
    review_notes: str | None = None,
):
    """
    Perform analyst review of evidence.

    Accepted evidence must:
    - be collected
    - have verified integrity
    - have a reviewer
    """

    allowed_review_statuses = {
        "accepted",
        "rejected",
    }

    if review_status not in allowed_review_statuses:
        raise ValueError(
            "Review status must be either 'accepted' or 'rejected'."
        )

    if not reviewed_by:
        raise ValueError(
            "Reviewer name is required."
        )

    evidence = (
        db.query(Evidence)
        .filter(Evidence.id == evidence_id)
        .first()
    )

    if not evidence:
        raise ValueError("Evidence not found.")

    if review_status == "accepted":

        if evidence.status != "collected":
            raise ValueError(
                "Evidence must be collected before acceptance."
            )

        if evidence.integrity_status != "verified":
            raise ValueError(
                "Evidence integrity must be verified before acceptance."
            )

    evidence.review_status = review_status
    evidence.reviewed_by = reviewed_by
    evidence.reviewed_at = datetime.utcnow()

    if review_notes:
        evidence.description = (
            f"{evidence.description}\n\n"
            f"Analyst Review: {review_notes}"
        )

    db.commit()
    db.refresh(evidence)

    return evidence