from sqlalchemy.orm import Session

from app.models.control import Control
from app.models.incident import Incident
from app.models.incident_enrichment import IncidentEnrichment
from app.models.risk import Risk
from app.models.risk_control import RiskControl


def create_risk_control_relationship(
    db: Session,
    risk: Risk,
    control: Control,
    relationship: str = "mitigates",
):
    existing_relationship = (
        db.query(RiskControl)
        .filter(
            RiskControl.risk_id == risk.id,
            RiskControl.control_id == control.id,
        )
        .first()
    )

    if existing_relationship:
        return existing_relationship, False

    risk_control = RiskControl(
        risk_id=risk.id,
        control_id=control.id,
        relationship=relationship,
    )

    db.add(risk_control)
    db.commit()
    db.refresh(risk_control)

    return risk_control, True


def create_risk_controls_from_incident(
    db: Session,
    incident: Incident,
):
    # --------------------------------------------------------
    # Find the risk associated with the incident
    # --------------------------------------------------------

    risk = (
        db.query(Risk)
        .filter(
            Risk.incident_id == incident.id
        )
        .first()
    )

    if not risk:
        raise ValueError(
            "Risk not found for this incident. "
            "Create the risk before creating risk-control relationships."
        )

    # --------------------------------------------------------
    # Get incident enrichment
    # --------------------------------------------------------

    enrichment = (
        db.query(IncidentEnrichment)
        .filter(
            IncidentEnrichment.incident_id
            == incident.id
        )
        .first()
    )

    if not enrichment:
        raise ValueError(
            "Incident enrichment not found."
        )

    created_relationships = []
    existing_relationships = []

    # --------------------------------------------------------
    # Create relationships from recommended controls
    # --------------------------------------------------------

    for recommended_control in enrichment.recommended_controls:
        control_id = recommended_control.get("id")

        if not control_id:
            continue

        control = (
            db.query(Control)
            .filter(
                Control.control_id == control_id
            )
            .first()
        )

        if not control:
            continue

        relationship, created = (
            create_risk_control_relationship(
                db=db,
                risk=risk,
                control=control,
                relationship="mitigates",
            )
        )

        if created:
            created_relationships.append(
                relationship
            )
        else:
            existing_relationships.append(
                relationship
            )

    return (
        created_relationships,
        existing_relationships,
    )