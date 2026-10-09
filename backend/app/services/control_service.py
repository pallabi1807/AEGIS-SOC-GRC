from sqlalchemy.orm import Session

from app.models.control import Control
from app.models.incident import Incident
from app.models.incident_enrichment import IncidentEnrichment


def create_control(
    db: Session,
    control_id: str,
    name: str,
    description: str,
    control_type: str = "detective",
    status: str = "planned",
    owner: str | None = None,
):
    existing_control = (
        db.query(Control)
        .filter(
            Control.control_id == control_id
        )
        .first()
    )

    if existing_control:
        return existing_control, False

    control = Control(
        control_id=control_id,
        name=name,
        description=description,
        control_type=control_type,
        status=status,
        owner=owner,
    )

    db.add(control)
    db.commit()
    db.refresh(control)

    return control, True


def create_controls_from_incident(
    db: Session,
    incident: Incident,
):
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
            "Incident enrichment not found. "
            "Enrich the incident before creating controls."
        )

    created_controls = []
    existing_controls = []

    for recommended_control in enrichment.recommended_controls:
        control_id = recommended_control.get("id")
        name = recommended_control.get("name")

        if not control_id or not name:
            continue

        control, created = create_control(
            db=db,
            control_id=control_id,
            name=name,
            description=(
                f"Control recommended by AEGIS enrichment "
                f"for incident {incident.incident_number}."
            ),
            control_type="detective",
            status="planned",
            owner=None,
        )

        if created:
            created_controls.append(control)
        else:
            existing_controls.append(control)

    return (
        created_controls,
        existing_controls,
    )