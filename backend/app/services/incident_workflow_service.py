from uuid import UUID

from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.services.incident_enrichment_service import enrich_incident
from app.services.risk_service import create_risk_from_incident
from app.services.control_service import create_controls_from_incident
from app.services.risk_control_service import (
    create_risk_controls_from_incident,
)
from app.services.remediation_service import (
    create_remediations_from_risk,
)


def process_incident_workflow(
    db: Session,
    incident_id: UUID,
):
    """
    Run the complete AEGIS SOC-GRC workflow for an existing incident.

    Workflow:

        Incident
           ↓
        Enrichment
           ↓
          Risk
           ↓
        Controls
           ↓
      Risk-Control mappings
           ↓
       Remediation
           ↓
       Verification
    """

    # --------------------------------------------------------
    # 1. Find incident
    # --------------------------------------------------------

    incident = (
        db.query(Incident)
        .filter(Incident.id == incident_id)
        .first()
    )

    if not incident:
        raise ValueError("Incident not found.")

    # --------------------------------------------------------
    # 2. Generate / refresh enrichment
    # --------------------------------------------------------

    enrichment = enrich_incident(
        db=db,
        incident=incident,
    )

    # --------------------------------------------------------
    # 3. Create or reuse risk
    # --------------------------------------------------------

    risk, risk_created = create_risk_from_incident(
        db=db,
        incident=incident,
    )

    # --------------------------------------------------------
    # 4. Create or reuse recommended controls
    # --------------------------------------------------------

    controls, controls_created = create_controls_from_incident(
        db=db,
        incident=incident,
    )

    # --------------------------------------------------------
    # 5. Create or reuse risk-control relationships
    # --------------------------------------------------------

    relationships, relationships_created = (
        create_risk_controls_from_incident(
            db=db,
            incident=incident,
        )
    )

    # --------------------------------------------------------
    # 6. Create or reuse remediations
    # --------------------------------------------------------

    remediations = create_remediations_from_risk(
        db=db,
        risk_id=risk.id,
    )

    # --------------------------------------------------------
    # 7. Return complete workflow result
    # --------------------------------------------------------

    return {
        "message": "Incident SOC-GRC workflow processed successfully.",
        "incident_id": incident.id,
        "incident_number": incident.incident_number,
        "enrichment_id": enrichment.id,

        "risk": risk,
        "risk_created": risk_created,

        "controls": controls,
        "controls_created": controls_created,

        "risk_controls": relationships,
        "risk_controls_created": relationships_created,

        "remediations": remediations,
    }