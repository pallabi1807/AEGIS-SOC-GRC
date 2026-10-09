from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.control import Control
from app.models.incident import Incident
from app.schemas.control import ControlCreate, ControlResponse
from app.services.control_service import create_controls_from_incident


router = APIRouter(
    prefix="/controls",
    tags=["Control Management"],
)


# ============================================================
# LIST CONTROLS
# ============================================================

@router.get(
    "",
    response_model=list[ControlResponse],
)
def get_controls(
    db: Session = Depends(get_db),
):
    controls = (
        db.query(Control)
        .order_by(
            Control.created_at.desc()
        )
        .all()
    )

    return controls


# ============================================================
# GET CONTROL BY ID
# ============================================================

@router.get(
    "/{control_id}",
    response_model=ControlResponse,
)
def get_control(
    control_id: UUID,
    db: Session = Depends(get_db),
):
    control = (
        db.query(Control)
        .filter(
            Control.id == control_id
        )
        .first()
    )

    if not control:
        raise HTTPException(
            status_code=404,
            detail="Control not found",
        )

    return control


# ============================================================
# CREATE CONTROLS FROM INCIDENT
# ============================================================

@router.post(
    "/from-incident/{incident_id}",
    response_model=list[ControlResponse],
)
def create_controls(
    incident_id: UUID,
    db: Session = Depends(get_db),
):
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id
        )
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    try:
        created_controls, existing_controls = (
            create_controls_from_incident(
                db=db,
                incident=incident,
            )
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    return created_controls + existing_controls


# ============================================================
# CREATE MANUAL CONTROL
# ============================================================

@router.post(
    "",
    response_model=ControlResponse,
)
def create_manual_control(
    control_data: ControlCreate,
    db: Session = Depends(get_db),
):
    existing_control = (
        db.query(Control)
        .filter(
            Control.control_id
            == control_data.control_id
        )
        .first()
    )

    if existing_control:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Control '{control_data.control_id}' "
                "already exists."
            ),
        )

    control = Control(
        control_id=control_data.control_id,
        name=control_data.name,
        description=control_data.description,
        control_type=control_data.control_type,
        status=control_data.status,
        owner=control_data.owner,
    )

    db.add(control)
    db.commit()
    db.refresh(control)

    return control