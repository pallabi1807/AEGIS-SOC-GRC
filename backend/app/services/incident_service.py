from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.incident import Incident
from app.models.incident_activity import IncidentActivity
from app.services.incident_enrichment_service import (
    enrich_incident,
)


# ============================================================
# INCIDENT SEVERITY POLICY
# ============================================================

INCIDENT_SEVERITIES = {
    "critical",
    "high",
    "medium",
}


# ============================================================
# INCIDENT STATUS POLICY
# ============================================================

INCIDENT_STATUSES = {
    "open",
    "investigating",
    "containment",
    "remediation",
    "verification",
    "resolved",
}


# ============================================================
# VALID STATUS TRANSITIONS
# ============================================================

VALID_STATUS_TRANSITIONS = {
    "open": {
        "investigating",
    },
    "investigating": {
        "containment",
    },
    "containment": {
        "remediation",
    },
    "remediation": {
        "verification",
    },
    "verification": {
        "resolved",
    },
    "resolved": set(),
}


# ============================================================
# INCIDENT NUMBER GENERATOR
# ============================================================

def generate_incident_number(db: Session) -> str:
    """
    Generate the next sequential incident number.
    """

    existing_count = db.query(Incident).count()

    return f"INC-{existing_count + 1:06d}"


# ============================================================
# CREATE INCIDENT ACTIVITY
# ============================================================

def create_incident_activity(
    db: Session,
    incident: Incident,
    activity_type: str,
    message: str,
    actor: str = "system",
) -> IncidentActivity:
    """
    Create an activity entry for an incident.
    """

    activity = IncidentActivity(
        incident_id=incident.id,
        activity_type=activity_type,
        message=message,
        actor=actor,
    )

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return activity


# ============================================================
# CREATE OR GET INCIDENT FROM ALERT
# ============================================================

def create_incident_from_alert(
    db: Session,
    alert: Alert,
) -> tuple[Incident | None, bool]:
    """
    Create an incident from an alert.

    Returns:
        (incident, created)
    """

    existing_incident = (
        db.query(Incident)
        .filter(
            Incident.alert_id == alert.id
        )
        .first()
    )

    if existing_incident:
        return existing_incident, False

    severity = alert.severity.lower()

    if severity not in INCIDENT_SEVERITIES:
        return None, False

    incident = Incident(
        incident_number=generate_incident_number(db),
        alert_id=alert.id,
        title=alert.title,
        description=alert.description,
        severity=alert.severity,
        status="open",
        asset_id=alert.asset_id,
        source_ip=alert.source_ip,
        username=alert.username,
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)

    create_incident_activity(
        db=db,
        incident=incident,
        activity_type="incident_created",
        message=(
            f"Incident {incident.incident_number} "
            f"automatically created from alert "
            f"{alert.rule_id}: {alert.title}."
        ),
        actor="system",
    )

    # --------------------------------------------------------
    # Automatic incident enrichment
    # --------------------------------------------------------

    enrichment = enrich_incident(
        db=db,
        incident=incident,
    )

    # --------------------------------------------------------
    # Record enrichment activity
    # --------------------------------------------------------

    create_incident_activity(
        db=db,
        incident=incident,
        activity_type="incident_enriched",
        message=(
            f"Automatic enrichment completed. "
            f"Risk score: {enrichment.risk_score}, "
            f"risk level: {enrichment.risk_level}, "
            f"related events: "
            f"{enrichment.related_event_count}, "
            f"IOCs: {len(enrichment.iocs)}, "
            f"MITRE techniques: "
            f"{len(enrichment.mitre_techniques)}."
        ),
        actor="system",
    )
  

    return incident, True


# ============================================================
# CREATE INCIDENTS FROM ALERTS
# ============================================================

def create_incidents_from_alerts(
    db: Session,
    alerts: list[Alert],
) -> tuple[list[Incident], int, int]:

    incidents = []

    created_count = 0
    existing_count = 0

    for alert in alerts:

        incident, created = create_incident_from_alert(
            db=db,
            alert=alert,
        )

        if incident is None:
            continue

        incidents.append(incident)

        if created:
            created_count += 1
        else:
            existing_count += 1

    return (
        incidents,
        created_count,
        existing_count,
    )


# ============================================================
# UPDATE INCIDENT STATUS
# ============================================================

def update_incident_status(
    db: Session,
    incident: Incident,
    new_status: str,
    actor: str,
) -> Incident:
    """
    Update an incident status using the controlled
    SOC incident lifecycle.
    """

    new_status = new_status.lower().strip()
    current_status = incident.status.lower().strip()

    # --------------------------------------------------------
    # Validate requested status
    # --------------------------------------------------------

    if new_status not in INCIDENT_STATUSES:
        raise ValueError(
            f"Invalid incident status: {new_status}"
        )

    # --------------------------------------------------------
    # Prevent duplicate status changes
    # --------------------------------------------------------

    if current_status == new_status:
        raise ValueError(
            f"Incident is already in '{new_status}' status."
        )

    # --------------------------------------------------------
    # Validate lifecycle transition
    # --------------------------------------------------------

    allowed_statuses = VALID_STATUS_TRANSITIONS.get(
        current_status,
        set(),
    )

    if new_status not in allowed_statuses:
        raise ValueError(
            f"Invalid status transition: "
            f"{current_status} -> {new_status}"
        )

    # --------------------------------------------------------
    # Update incident
    # --------------------------------------------------------

    incident.status = new_status

    db.commit()
    db.refresh(incident)

    # --------------------------------------------------------
    # Create automatic timeline activity
    # --------------------------------------------------------

    create_incident_activity(
        db=db,
        incident=incident,
        activity_type="status_changed",
        message=(
            f"Incident status changed from "
            f"{current_status} to {new_status}."
        ),
        actor=actor,
    )

    return incident