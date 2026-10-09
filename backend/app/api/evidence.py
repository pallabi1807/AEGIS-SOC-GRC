from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.control import Control
from app.models.evidence import Evidence
from app.schemas.evidence import (
    EvidenceCreate,
    EvidenceResponse,
    EvidenceIntegrityVerification,
)
from app.services.evidence_service import (
    collect_evidence_artifact,
    create_evidence,
    verify_evidence_integrity,
    review_evidence,
)
from app.services.audit_service import record_audit_event

router = APIRouter(
    prefix="/evidence",
    tags=["Evidence Management"],
)


# ============================================================
# LIST EVIDENCE
# ============================================================

@router.get(
    "",
    response_model=list[EvidenceResponse],
)
def get_evidence(
    db: Session = Depends(get_db),
):
    return (
        db.query(Evidence)
        .order_by(Evidence.created_at.desc())
        .all()
    )


# ============================================================
# GET EVIDENCE BY ID
# ============================================================

@router.get(
    "/{evidence_id}",
    response_model=EvidenceResponse,
)
def get_evidence_by_id(
    evidence_id: UUID,
    db: Session = Depends(get_db),
):
    evidence = (
        db.query(Evidence)
        .filter(Evidence.id == evidence_id)
        .first()
    )

    if not evidence:
        raise HTTPException(
            status_code=404,
            detail="Evidence not found.",
        )

    return evidence

# ============================================================
# VERIFY EVIDENCE INTEGRITY
# ============================================================

@router.patch(
    "/{evidence_id}/integrity",
    response_model=EvidenceResponse,
)
def verify_integrity(
    evidence_id: UUID,
    db: Session = Depends(get_db),
):
    try:
        evidence = verify_evidence_integrity(
            db=db,
            evidence_id=evidence_id,
        )

        record_audit_event(
            db=db,
            actor="SOC Analyst",
            action="EVIDENCE_INTEGRITY_VERIFIED",
            entity_type="Evidence",
            entity_id=evidence.id,
            description=(
                f"Integrity verification completed for "
                f"{evidence.evidence_number}. "
                f"Result: {evidence.integrity_status}."
            ),
            old_value="unverified",
            new_value=evidence.integrity_status,
            source="evidence",
        )

        return evidence

    except ValueError as error:
        # Integrity mismatch is represented as a failed
        # verification by the service.
        # The service has already persisted the failed state.
        if "integrity verification failed" in str(error).lower():
            try:
                evidence = (
                    db.query(Evidence)
                    .filter(Evidence.id == evidence_id)
                    .first()
                )

                if evidence:
                    record_audit_event(
                        db=db,
                        actor="SOC Analyst",
                        action="EVIDENCE_INTEGRITY_FAILED",
                        entity_type="Evidence",
                        entity_id=evidence.id,
                        description=(
                            f"Integrity verification failed for "
                            f"{evidence.evidence_number}. "
                            f"The artifact hash does not match "
                            f"the recorded SHA-256 hash."
                        ),
                        old_value="unverified",
                        new_value="failed",
                        source="evidence",
                    )
            except Exception:
                pass

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
# ============================================================
# CREATE EVIDENCE
# ============================================================

@router.post(
    "",
    response_model=EvidenceResponse,
)
def create_new_evidence(
    evidence_data: EvidenceCreate,
    db: Session = Depends(get_db),
):
    try:
        evidence, created = create_evidence(
            db=db,
            title=evidence_data.title,
            description=evidence_data.description,
            evidence_type=evidence_data.evidence_type,
            source=evidence_data.source,
            control_id=evidence_data.control_id,
            status=evidence_data.status,
            evidence_number=evidence_data.evidence_number,
            artifact_name=evidence_data.artifact_name,
            collection_method=evidence_data.collection_method,
            sha256_hash=evidence_data.sha256_hash,
            integrity_status=evidence_data.integrity_status,
            review_status=evidence_data.review_status,
            reviewed_by=evidence_data.reviewed_by,
            reviewed_at=evidence_data.reviewed_at,
        )

        return evidence

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

@router.post(
    "/{evidence_id}/verify-integrity",
    response_model=EvidenceResponse,
)
def verify_integrity(
    evidence_id: UUID,
    db: Session = Depends(get_db),
):
    try:
        return verify_evidence_integrity(
            db=db,
            evidence_id=evidence_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
@router.post(
    "/{evidence_id}/review",
    response_model=EvidenceResponse,
)
def review_evidence_record(
    evidence_id: UUID,
    review_status: str,
    reviewed_by: str,
    review_notes: str | None = None,
    db: Session = Depends(get_db),
):
    try:
        return review_evidence(
            db=db,
            evidence_id=evidence_id,
            review_status=review_status,
            reviewed_by=reviewed_by,
            review_notes=review_notes,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
@router.post(
    "/{evidence_id}/artifact",
    response_model=EvidenceResponse,
)
async def upload_evidence_artifact(
    evidence_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        artifact_content = await file.read()

        return collect_evidence_artifact(
            db=db,
            evidence_id=evidence_id,
            artifact_name=file.filename or "evidence_artifact",
            artifact_content=artifact_content,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
# ============================================================
# LIST EVIDENCE FOR A CONTROL
# ============================================================

@router.get(
    "/control/{control_id}",
    response_model=list[EvidenceResponse],
)
def get_control_evidence(
    control_id: UUID,
    db: Session = Depends(get_db),
):
    control = (
        db.query(Control)
        .filter(Control.id == control_id)
        .first()
    )

    if not control:
        raise HTTPException(
            status_code=404,
            detail="Control not found.",
        )

    return (
        db.query(Evidence)
        .filter(Evidence.control_id == control_id)
        .order_by(Evidence.created_at.desc())
        .all()
    )