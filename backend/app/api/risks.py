from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.incident import Incident
from app.models.risk import Risk
from app.schemas.risk import RiskCreate, RiskResponse
from app.services.risk_service import create_risk_from_incident


router = APIRouter(
    prefix="/risks",
    tags=["Risk Management"],
)


# ============================================================
# LIST RISKS
# ============================================================

@router.get(
    "",
    response_model=list[RiskResponse],
)
def get_risks(
    db: Session = Depends(get_db),
):
    risks = (
        db.query(Risk)
        .order_by(
            Risk.created_at.desc()
        )
        .all()
    )

    return risks


# ============================================================
# GET RISK BY ID
# ============================================================

@router.get(
    "/{risk_id}",
    response_model=RiskResponse,
)
def get_risk(
    risk_id: UUID,
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

    return risk


# ============================================================
# CREATE RISK FROM INCIDENT
# ============================================================

@router.post(
    "/from-incident/{incident_id}",
    response_model=RiskResponse,
)
def create_risk(
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
        risk, created = create_risk_from_incident(
            db=db,
            incident=incident,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    return risk


# ============================================================
# CREATE MANUAL RISK
# ============================================================

@router.post(
    "",
    response_model=RiskResponse,
)
def create_manual_risk(
    risk_data: RiskCreate,
    db: Session = Depends(get_db),
):
    risk = Risk(
        risk_number=(
            f"RISK-{db.query(Risk).count() + 1:06d}"
        ),
        title=risk_data.title,
        description=risk_data.description,
        risk_score=risk_data.risk_score,
        risk_level=risk_data.risk_level,
        status="open",
        treatment=risk_data.treatment,
        owner=risk_data.owner,
        incident_id=risk_data.incident_id,
        asset_id=risk_data.asset_id,
    )

    db.add(risk)
    db.commit()
    db.refresh(risk)

    return risk