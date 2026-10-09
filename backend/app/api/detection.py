from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db

from app.detection.auth_rules import (
    detect_multiple_failed_logins,
    detect_success_after_failed_logins,
    detect_new_source_ip,
    detect_multiple_accounts_from_ip,
    detect_privileged_login,
    detect_account_lockout,
)
from app.detection.network_rules import (
    detect_port_scan,
    detect_repeated_connection_attempts,
    detect_unusual_destination_port,
    detect_high_volume_connections,
    detect_external_destination,
)
from app.detection.endpoint_rules import (
    detect_suspicious_powershell,
    detect_suspicious_cmd,
    detect_lolbin_abuse,
    detect_suspicious_process_spawn,
    detect_persistence_command,
)
from app.detection.malware_rules import (
    detect_suspicious_file_creation,
    detect_malicious_hash,
    detect_suspicious_file_execution,
    detect_malware_persistence,
)
from app.detection.phishing_rules import (
    detect_suspicious_email_link,
    detect_malicious_attachment,
    detect_credential_harvesting_page,
    detect_suspicious_sender_domain,
)
from app.detection.web_rules import (
    detect_sql_injection,
    detect_xss_attempt,
    detect_directory_traversal,
    detect_web_scanner,
)
from app.services.incident_service import create_incidents_from_alerts

router = APIRouter(prefix="/detection", tags=["Detection"])


@router.post("/run")
def run_detection(
    rule_ids: str | None = None,
    db: Session = Depends(get_db),
):
    # Authentication
    auth001_created, auth001_updated = detect_multiple_failed_logins(db)
    auth002_created, auth002_updated = detect_success_after_failed_logins(db)
    auth003_created, auth003_updated = detect_new_source_ip(db)
    auth004_created, auth004_updated = detect_multiple_accounts_from_ip(db)
    auth005_created, auth005_updated = detect_privileged_login(db)
    auth006_created, auth006_updated = detect_account_lockout(db)

    # Network
    net001_created, net001_updated = detect_port_scan(db)
    net002_created, net002_updated = detect_repeated_connection_attempts(db)
    net003_created, net003_updated = detect_unusual_destination_port(db)
    net004_created, net004_updated = detect_high_volume_connections(db)
    net005_created, net005_updated = detect_external_destination(db)

    # Endpoint / Process
    proc001_created, proc001_updated = detect_suspicious_powershell(db)
    proc002_created, proc002_updated = detect_suspicious_cmd(db)
    proc003_created, proc003_updated = detect_lolbin_abuse(db)
    proc004_created, proc004_updated = detect_suspicious_process_spawn(db)
    proc005_created, proc005_updated = detect_persistence_command(db)

    # Malware
    mal001_created, mal001_updated = detect_suspicious_file_creation(db)
    mal002_created, mal002_updated = detect_malicious_hash(db)
    mal003_created, mal003_updated = detect_suspicious_file_execution(db)
    mal004_created, mal004_updated = detect_malware_persistence(db)

    # Phishing
    phish001_created, phish001_updated = detect_suspicious_email_link(db)
    phish002_created, phish002_updated = detect_malicious_attachment(db)
    phish003_created, phish003_updated = detect_credential_harvesting_page(db)
    phish004_created, phish004_updated = detect_suspicious_sender_domain(db)

    # Web
    web001_created, web001_updated = detect_sql_injection(db)
    web002_created, web002_updated = detect_xss_attempt(db)
    web003_created, web003_updated = detect_directory_traversal(db)
    web004_created, web004_updated = detect_web_scanner(db)

    created_alerts = (
        auth001_created + auth002_created + auth003_created
        + auth004_created + auth005_created + auth006_created
        + net001_created + net002_created + net003_created
        + net004_created + net005_created
        + proc001_created + proc002_created + proc003_created
        + proc004_created + proc005_created
        + mal001_created + mal002_created + mal003_created + mal004_created
        + phish001_created + phish002_created + phish003_created + phish004_created
        + web001_created + web002_created + web003_created + web004_created
    )

    updated_alerts = (
        auth001_updated + auth002_updated + auth003_updated
        + auth004_updated + auth005_updated + auth006_updated
        + net001_updated + net002_updated + net003_updated
        + net004_updated + net005_updated
        + proc001_updated + proc002_updated + proc003_updated
        + proc004_updated + proc005_updated
        + mal001_updated + mal002_updated + mal003_updated + mal004_updated
        + phish001_updated + phish002_updated + phish003_updated + phish004_updated
        + web001_updated + web002_updated + web003_updated + web004_updated
    )

    # Scenario-scoped response.
    requested_rules = None
    if rule_ids:
        requested_rules = {
            value.strip().upper()
            for value in rule_ids.split(",")
            if value.strip()
        }

        created_alerts = [
            alert for alert in created_alerts
            if alert.rule_id.upper() in requested_rules
        ]
        updated_alerts = [
            alert for alert in updated_alerts
            if alert.rule_id.upper() in requested_rules
        ]

    # De-duplicate alert objects.
    alerts = []
    alert_objects = []
    seen_alert_ids = set()

    for alert in created_alerts + updated_alerts:
        alert_id = str(alert.id)

        if alert_id in seen_alert_ids:
            continue

        seen_alert_ids.add(alert_id)
        alert_objects.append(alert)

        alerts.append({
            "id": alert_id,
            "rule_id": alert.rule_id,
            "title": alert.title,
            "severity": alert.severity,
            "status": alert.status,
            "username": alert.username,
            "source_ip": alert.source_ip,
            "event_count": alert.event_count,
        })

    incidents, incidents_created, incidents_existing = create_incidents_from_alerts(
        db=db,
        alerts=alert_objects,
    )

    incident_response = [
        {
            "id": str(incident.id),
            "incident_number": incident.incident_number,
            "alert_id": str(incident.alert_id),
            "title": incident.title,
            "severity": incident.severity,
            "status": incident.status,
            "username": incident.username,
            "source_ip": incident.source_ip,
            "created_at": incident.created_at,
        }
        for incident in incidents
    ]

    return {
        "status": "completed",
        "scope": "scenario" if requested_rules else "all",
        "rule_ids": sorted(requested_rules) if requested_rules else None,
        "alerts_created": len(created_alerts),
        "alerts_updated": len(updated_alerts),
        "incidents_created": incidents_created,
        "incidents_existing": incidents_existing,
        "alerts": alerts,
        "incidents": incident_response,
    }
