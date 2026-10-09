from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.remediation import Remediation
from app.schemas.remediation import (
    RemediationCreate,
    RemediationResponse,
    RemediationStatusUpdate,
)
from app.services.remediation_service import (
    create_remediation,
    create_remediations_from_risk,
    update_remediation_status,
)

router = APIRouter(
    prefix="/remediations",
    tags=["Remediations"],
)


@router.get("", response_model=list[RemediationResponse])
def get_remediations(
    db: Session = Depends(get_db),
):
    return (
        db.query(Remediation)
        .order_by(Remediation.created_at.desc())
        .all()
    )


@router.post(
    "/from-risk/{risk_id}",
    response_model=list[RemediationResponse],
)
def create_remediations_from_existing_risk(
    risk_id: UUID,
    db: Session = Depends(get_db),
):
    try:
        remediations = create_remediations_from_risk(
            db=db,
            risk_id=risk_id,
        )

        return remediations

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
        
@router.get(
    "/{remediation_id}",
    response_model=RemediationResponse,
)
def get_remediation(
    remediation_id: UUID,
    db: Session = Depends(get_db),
):
    remediation = (
        db.query(Remediation)
        .filter(Remediation.id == remediation_id)
        .first()
    )

    if not remediation:
        raise HTTPException(
            status_code=404,
            detail="Remediation not found.",
        )

    return remediation


@router.post(
    "",
    response_model=RemediationResponse,
)
def create_new_remediation(
    remediation_data: RemediationCreate,
    db: Session = Depends(get_db),
):
    try:
        remediation = create_remediation(
            db=db,
            title=remediation_data.title,
            description=remediation_data.description,
            priority=remediation_data.priority,
            risk_id=remediation_data.risk_id,
            control_id=remediation_data.control_id,
            owner=remediation_data.owner,
            due_date=remediation_data.due_date,
        )

        return remediation

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@router.patch(
    "/{remediation_id}/status",
    response_model=RemediationResponse,
)
def change_remediation_status(
    remediation_id: UUID,
    status_data: RemediationStatusUpdate,
    db: Session = Depends(get_db),
):
    remediation = (
        db.query(Remediation)
        .filter(Remediation.id == remediation_id)
        .first()
    )

    if not remediation:
        raise HTTPException(
            status_code=404,
            detail="Remediation not found.",
        )

    try:
        return update_remediation_status(
            db=db,
            remediation=remediation,
            status=status_data.status,
            verification_status=status_data.verification_status,
            verification_notes=status_data.verification_notes,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )