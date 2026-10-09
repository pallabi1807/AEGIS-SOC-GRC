from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.alert import Alert
from app.models.incident import Incident
from app.models.incident_activity import IncidentActivity
from app.models.incident_enrichment import IncidentEnrichment
from app.schemas.incident import (
    IncidentResponse,
    IncidentStatusUpdate,
)
from app.schemas.incident_activity import (
    IncidentActivityCreate,
    IncidentActivityResponse,
)
from app.schemas.incident_enrichment import (
    IncidentEnrichmentResponse,
)
from app.services.incident_enrichment_service import (
    enrich_incident,
)
from app.services.incident_service import (
    create_incident_activity,
    create_incident_from_alert,
    update_incident_status,
)
from app.services.incident_workflow_service import (
    process_incident_workflow,
)


router = APIRouter(
    prefix="/incidents",
    tags=["Incidents"],
)


# ============================================================
# LIST INCIDENTS
# ============================================================

@router.get(
    "",
    response_model=list[IncidentResponse],
)
def get_incidents(
    db: Session = Depends(get_db),
):
    incidents = (
        db.query(Incident)
        .order_by(
            Incident.created_at.desc()
        )
        .all()
    )

    return incidents


# ============================================================
# GET INCIDENT ENRICHMENT
# ============================================================

@router.get(
    "/{incident_id}/enrichment",
    response_model=IncidentEnrichmentResponse,
)
def get_incident_enrichment(
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

    enrichment = (
        db.query(IncidentEnrichment)
        .filter(
            IncidentEnrichment.incident_id
            == incident_id
        )
        .first()
    )

    if not enrichment:
        raise HTTPException(
            status_code=404,
            detail="Incident enrichment not found",
        )

    return enrichment


# ============================================================
# GET INCIDENT BY ID
# ============================================================

@router.get(
    "/{incident_id}",
    response_model=IncidentResponse,
)
def get_incident(
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

    return incident


# ============================================================
# CREATE INCIDENT FROM ALERT
# AUTOMATIC SOC-GRC WORKFLOW
# ============================================================

@router.post(
    "/from-alert/{alert_id}",
    response_model=IncidentResponse,
)
def create_incident(
    alert_id: UUID,
    db: Session = Depends(get_db),
):
    alert = (
        db.query(Alert)
        .filter(
            Alert.id == alert_id
        )
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    incident_result = create_incident_from_alert(
        db=db,
        alert=alert,
    )

    if not incident_result:
        raise HTTPException(
            status_code=400,
            detail=(
                "Incident could not be created "
                "for this alert."
            ),
        )

    # --------------------------------------------------------
    # Extract incident and creation status
    # --------------------------------------------------------

    if isinstance(incident_result, tuple):
        incident = incident_result[0]

        if len(incident_result) > 1:
            incident_created = incident_result[1]
        else:
            incident_created = True
    else:
        incident = incident_result
        incident_created = True

    # --------------------------------------------------------
    # AUTOMATIC SOC-GRC WORKFLOW
    #
    # Only run automatically for a newly created incident.
    #
    # Workflow:
    # Incident
    #    ↓
    # Enrichment
    #    ↓
    # Risk
    #    ↓
    # Controls
    #    ↓
    # Risk-Control mappings
    # --------------------------------------------------------

    if incident_created:
        try:
            process_incident_workflow(
                db=db,
                incident_id=incident.id,
            )

        except ValueError as error:
            # The incident itself has already been created.
            # Do not hide the incident because a downstream
            # SOC-GRC processing step failed.
            create_incident_activity(
                db=db,
                incident=incident,
                activity_type="workflow_error",
                message=(
                    "Automatic SOC-GRC workflow could not "
                    f"be completed: {error}"
                ),
                actor="system",
            )

    return incident


# ============================================================
# UPDATE INCIDENT STATUS
# ============================================================

@router.patch(
    "/{incident_id}/status",
    response_model=IncidentResponse,
)
def change_incident_status(
    incident_id: UUID,
    status_data: IncidentStatusUpdate,
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
        updated_incident = update_incident_status(
            db=db,
            incident=incident,
            new_status=status_data.status,
            actor=status_data.actor,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    return updated_incident


# ============================================================
# LIST INCIDENT ACTIVITIES
# ============================================================

@router.get(
    "/{incident_id}/activities",
    response_model=list[IncidentActivityResponse],
)
def get_incident_activities(
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

    activities = (
        db.query(IncidentActivity)
        .filter(
            IncidentActivity.incident_id == incident_id
        )
        .order_by(
            IncidentActivity.created_at.asc()
        )
        .all()
    )

    return activities


# ============================================================
# ADD INCIDENT ACTIVITY
# ============================================================

@router.post(
    "/{incident_id}/activities",
    response_model=IncidentActivityResponse,
)
def add_incident_activity(
    incident_id: UUID,
    activity_data: IncidentActivityCreate,
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

    activity = create_incident_activity(
        db=db,
        incident=incident,
        activity_type=activity_data.activity_type,
        message=activity_data.message,
        actor=activity_data.actor,
    )

    return activity


# ============================================================
# REFRESH INCIDENT ENRICHMENT
# ============================================================

@router.post(
    "/{incident_id}/enrichment/refresh",
    response_model=IncidentEnrichmentResponse,
)
def refresh_incident_enrichment(
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
        enrichment = enrich_incident(
            db=db,
            incident=incident,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    return enrichment


# ============================================================
# MANUAL INCIDENT SOC-GRC WORKFLOW
# ============================================================

@router.post(
    "/{incident_id}/process-workflow",
)
def process_incident(
    incident_id: UUID,
    db: Session = Depends(get_db),
):
    try:
        result = process_incident_workflow(
            db=db,
            incident_id=incident_id,
        )

        return {
            "message": (
                "Incident SOC-GRC workflow "
                "processed successfully."
            ),
            "incident_id": result["incident_id"],
            "incident_number": result["incident_number"],
            "enrichment_id": result["enrichment_id"],
            "risk": {
                "id": result["risk"].id,
                "risk_number": result["risk"].risk_number,
                "risk_score": result["risk"].risk_score,
                "risk_level": result["risk"].risk_level,
            },
            "risk_created": result["risk_created"],
            "controls_created": result["controls_created"],
            "risk_controls_created": (
                result["risk_controls_created"]
            ),
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )