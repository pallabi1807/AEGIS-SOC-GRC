from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.incident import Incident
from app.models.incident_enrichment import IncidentEnrichment
from app.models.risk import Risk


def generate_risk_number(db: Session) -> str:
    existing_count = db.query(Risk).count()

    return f"RISK-{existing_count + 1:06d}"


def create_risk_from_incident(
    db: Session,
    incident: Incident,
):
    # --------------------------------------------------------
    # Check whether this incident already has a risk
    # --------------------------------------------------------

    existing_risk = (
        db.query(Risk)
        .filter(
            Risk.incident_id == incident.id
        )
        .first()
    )

    if existing_risk:
        return existing_risk, False

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
            "Incident enrichment not found. "
            "Enrich the incident before creating a risk."
        )

    # --------------------------------------------------------
    # Get affected asset
    # --------------------------------------------------------

    asset = None

    if incident.asset_id:
        asset = (
            db.query(Asset)
            .filter(
                Asset.id == incident.asset_id
            )
            .first()
        )

    # --------------------------------------------------------
    # Build risk description
    # --------------------------------------------------------

    description = (
        f"Risk identified from incident "
        f"{incident.incident_number}. "
        f"{incident.description}"
    )

    # --------------------------------------------------------
    # Create risk
    # --------------------------------------------------------

    risk = Risk(
        risk_number=generate_risk_number(db),
        title=incident.title,
        description=description,
        risk_score=enrichment.risk_score,
        risk_level=enrichment.risk_level,
        status="open",
        treatment="mitigate",
        owner=None,
        incident_id=incident.id,
        asset_id=incident.asset_id,
    )

    db.add(risk)
    db.commit()
    db.refresh(risk)

    return risk, True


def create_risks_from_incidents(
    db: Session,
    incidents: list[Incident],
):
    risks = []

    created_count = 0
    existing_count = 0

    for incident in incidents:
        try:
            risk, created = create_risk_from_incident(
                db=db,
                incident=incident,
            )
        except ValueError:
            continue

        risks.append(risk)

        if created:
            created_count += 1
        else:
            existing_count += 1

    return (
        risks,
        created_count,
        existing_count,
    )