from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.incident import Incident
from app.models.risk import Risk
from app.models.risk_control import RiskControl
from app.models.control import Control
from app.services.risk_control_service import (
    create_risk_controls_from_incident,
)
from app.services.risk_control_service import (
    create_risk_control_relationship,
    create_risk_controls_from_incident,
)

router = APIRouter(
    prefix="/risk-controls",
    tags=["Risk Control Mapping"],
)


# ============================================================
# LIST RISK-CONTROL RELATIONSHIPS
# ============================================================

@router.get("")
def get_risk_controls(
    db: Session = Depends(get_db),
):
    relationships = (
        db.query(RiskControl)
        .order_by(
            RiskControl.created_at.desc()
        )
        .all()
    )

    results = []

    for relationship in relationships:
        risk = (
            db.query(Risk)
            .filter(
                Risk.id == relationship.risk_id
            )
            .first()
        )

        control = (
            db.query(Control)
            .filter(
                Control.id == relationship.control_id
            )
            .first()
        )

        results.append(
            {
                "id": relationship.id,
                "risk_id": relationship.risk_id,
                "risk_number": (
                    risk.risk_number
                    if risk
                    else None
                ),
                "control_id": relationship.control_id,
                "control_identifier": (
                    control.control_id
                    if control
                    else None
                ),
                "control_name": (
                    control.name
                    if control
                    else None
                ),
                "relationship": relationship.relationship,
                "created_at": relationship.created_at,
            }
        )

    return results


# ============================================================
# GET RELATIONSHIP BY ID
# ============================================================

@router.get("/{relationship_id}")
def get_risk_control(
    relationship_id: UUID,
    db: Session = Depends(get_db),
):
    relationship = (
        db.query(RiskControl)
        .filter(
            RiskControl.id == relationship_id
        )
        .first()
    )

    if not relationship:
        raise HTTPException(
            status_code=404,
            detail="Risk-control relationship not found",
        )

    risk = (
        db.query(Risk)
        .filter(
            Risk.id == relationship.risk_id
        )
        .first()
    )

    control = (
        db.query(Control)
        .filter(
            Control.id == relationship.control_id
        )
        .first()
    )

    return {
        "id": relationship.id,
        "risk_id": relationship.risk_id,
        "risk_number": (
            risk.risk_number
            if risk
            else None
        ),
        "control_id": relationship.control_id,
        "control_identifier": (
            control.control_id
            if control
            else None
        ),
        "control_name": (
            control.name
            if control
            else None
        ),
        "relationship": relationship.relationship,
        "created_at": relationship.created_at,
    }

# ============================================================
# CREATE SINGLE RISK-CONTROL MAPPING
# ============================================================

@router.post("")
def create_risk_control(
    risk_id: UUID,
    control_id: UUID,
    relationship: str = "mitigates",
    db: Session = Depends(get_db),
):
    risk = (
        db.query(Risk)
        .filter(
            Risk.id == risk_id
        )
        .first()
    )

    if not risk:
        raise HTTPException(
            status_code=404,
            detail="Risk not found",
        )

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

    try:
        risk_control, created = (
            create_risk_control_relationship(
                db=db,
                risk=risk,
                control=control,
                relationship=relationship,
            )
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    return {
        "id": risk_control.id,
        "risk_id": risk_control.risk_id,
        "risk_number": risk.risk_number,
        "control_id": risk_control.control_id,
        "control_identifier": control.control_id,
        "control_name": control.name,
        "relationship": risk_control.relationship,
        "created": created,
        "created_at": risk_control.created_at,
    }
# ============================================================
# CREATE RISK-CONTROL MAPPINGS FROM INCIDENT
# ============================================================

@router.post("/from-incident/{incident_id}")
def create_risk_controls(
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
        created_relationships, existing_relationships = (
            create_risk_controls_from_incident(
                db=db,
                incident=incident,
            )
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    relationships = (
        created_relationships
        + existing_relationships
    )

    results = []

    for relationship in relationships:
        risk = (
            db.query(Risk)
            .filter(
                Risk.id == relationship.risk_id
            )
            .first()
        )

        control = (
            db.query(Control)
            .filter(
                Control.id == relationship.control_id
            )
            .first()
        )

        results.append(
            {
                "id": relationship.id,
                "risk_id": relationship.risk_id,
                "risk_number": (
                    risk.risk_number
                    if risk
                    else None
                ),
                "control_id": relationship.control_id,
                "control_identifier": (
                    control.control_id
                    if control
                    else None
                ),
                "control_name": (
                    control.name
                    if control
                    else None
                ),
                "relationship": relationship.relationship,
                "created_at": relationship.created_at,
            }
        )

    return results