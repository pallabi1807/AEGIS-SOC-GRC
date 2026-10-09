from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.verification import Verification
from app.schemas.verification import (
    VerificationCreate,
    VerificationResponse,
)
from app.services.verification_service import (
    create_verification,
)


router = APIRouter(
    prefix="/verifications",
    tags=["Verifications"],
)


@router.get(
    "",
    response_model=list[VerificationResponse],
)
def get_verifications(
    db: Session = Depends(get_db),
):
    return (
        db.query(Verification)
        .order_by(Verification.created_at.desc())
        .all()
    )


@router.get(
    "/{verification_id}",
    response_model=VerificationResponse,
)
def get_verification(
    verification_id: UUID,
    db: Session = Depends(get_db),
):
    verification = (
        db.query(Verification)
        .filter(Verification.id == verification_id)
        .first()
    )

    if not verification:
        raise HTTPException(
            status_code=404,
            detail="Verification not found.",
        )

    return verification


@router.post(
    "",
    response_model=VerificationResponse,
)
def create_new_verification(
    verification_data: VerificationCreate,
    db: Session = Depends(get_db),
):
    try:
        verification = create_verification(
            db=db,
            remediation_id=verification_data.remediation_id,
            control_id=verification_data.control_id,
            verification_procedure=(
                verification_data.verification_procedure
            ),
            result=verification_data.result,
            findings=verification_data.findings,
            verifier=verification_data.verifier,
            notes=verification_data.notes,
        )

        return verification

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )