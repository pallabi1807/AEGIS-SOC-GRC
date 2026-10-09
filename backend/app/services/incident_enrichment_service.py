from datetime import timedelta

from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.asset import Asset
from app.models.incident import Incident
from app.models.incident_enrichment import IncidentEnrichment
from app.models.security_event import SecurityEvent


# ============================================================
# MITRE ATT&CK MAPPING
# ============================================================

MITRE_RULE_MAPPING = {

    # Authentication
    "AUTH-001": [
        {
            "id": "T1110.001",
            "name": "Password Guessing",
        },
    ],

    "AUTH-002": [
        {
            "id": "T1078",
            "name": "Valid Accounts",
        },
    ],

    "AUTH-004": [
        {
            "id": "T1110.003",
            "name": "Password Spraying",
        },
    ],

    "AUTH-005": [
        {
            "id": "T1078",
            "name": "Valid Accounts",
        },
    ],

    # Network
    "NET-001": [
        {
            "id": "T1046",
            "name": "Network Service Discovery",
        },
    ],

    "NET-002": [
        {
            "id": "T1046",
            "name": "Network Service Discovery",
        },
    ],

    "NET-003": [
        {
            "id": "T1046",
            "name": "Network Service Discovery",
        },
    ],

    # Process
    "PROC-001": [
        {
            "id": "T1059.001",
            "name": "PowerShell",
        },
    ],

    "PROC-002": [
        {
            "id": "T1059.003",
            "name": "Windows Command Shell",
        },
    ],

    "PROC-003": [
        {
            "id": "T1105",
            "name": "Ingress Tool Transfer",
        },
    ],

    "PROC-004": [
        {
            "id": "T1059.001",
            "name": "PowerShell",
        },
    ],

    "PROC-005": [
        {
            "id": "T1053.005",
            "name": "Scheduled Task",
        },
    ],

    # Malware
    "MAL-004": [
        {
            "id": "T1547.001",
            "name": "Registry Run Keys / Startup Folder",
        },
    ],

    # Phishing
    "PHISH-001": [
        {
            "id": "T1566.002",
            "name": "Spearphishing Link",
        },
    ],

    "PHISH-002": [
        {
            "id": "T1566.001",
            "name": "Spearphishing Attachment",
        },
    ],

    "PHISH-003": [
        {
            "id": "T1056.003",
            "name": "Web Portal Capture",
        },
    ],

    # Web
    "WEB-001": [
        {
            "id": "T1190",
            "name": "Exploit Public-Facing Application",
        },
    ],

    "WEB-002": [
        {
            "id": "T1190",
            "name": "Exploit Public-Facing Application",
        },
    ],

    "WEB-003": [
        {
            "id": "T1190",
            "name": "Exploit Public-Facing Application",
        },
    ],

    "WEB-004": [
        {
            "id": "T1046",
            "name": "Network Service Discovery",
        },
    ],
}


# ============================================================
# AEGIS CONTROL RECOMMENDATIONS
# ============================================================

CONTROL_MAPPING = {

    "AUTH-001": [
        {
            "id": "CTRL-AUTH-001",
            "name": "Account Lockout and Authentication Monitoring",
        },
        {
            "id": "CTRL-AUTH-002",
            "name": "Multi-Factor Authentication",
        },
    ],

    "AUTH-002": [
        {
            "id": "CTRL-AUTH-002",
            "name": "Multi-Factor Authentication",
        },
        {
            "id": "CTRL-AUTH-003",
            "name": "Anomalous Login Monitoring",
        },
    ],

    "AUTH-004": [
        {
            "id": "CTRL-AUTH-001",
            "name": "Account Lockout and Authentication Monitoring",
        },
        {
            "id": "CTRL-AUTH-004",
            "name": "Password Policy",
        },
    ],

    "AUTH-005": [
        {
            "id": "CTRL-PAM-001",
            "name": "Privileged Account Management",
        },
        {
            "id": "CTRL-PAM-002",
            "name": "Privileged Login Monitoring",
        },
    ],

    "AUTH-006": [
        {
            "id": "CTRL-AUTH-001",
            "name": "Account Lockout and Authentication Monitoring",
        },
    ],

    # Network
    "NET-001": [
        {
            "id": "CTRL-NET-001",
            "name": "Network Monitoring",
        },
        {
            "id": "CTRL-NET-002",
            "name": "Network Segmentation",
        },
    ],

    "NET-002": [
        {
            "id": "CTRL-NET-001",
            "name": "Network Monitoring",
        },
    ],

    "NET-003": [
        {
            "id": "CTRL-NET-001",
            "name": "Network Monitoring",
        },
        {
            "id": "CTRL-NET-003",
            "name": "Firewall and Port Control",
        },
    ],

    "NET-004": [
        {
            "id": "CTRL-NET-001",
            "name": "Network Monitoring",
        },
    ],

    "NET-005": [
        {
            "id": "CTRL-NET-003",
            "name": "Firewall and Port Control",
        },
        {
            "id": "CTRL-NET-004",
            "name": "Outbound Traffic Monitoring",
        },
    ],

    # Endpoint
    "PROC-001": [
        {
            "id": "CTRL-END-001",
            "name": "Endpoint Detection and Response",
        },
        {
            "id": "CTRL-END-002",
            "name": "PowerShell Monitoring",
        },
    ],

    "PROC-002": [
        {
            "id": "CTRL-END-001",
            "name": "Endpoint Detection and Response",
        },
    ],

    "PROC-003": [
        {
            "id": "CTRL-END-001",
            "name": "Endpoint Detection and Response",
        },
        {
            "id": "CTRL-END-003",
            "name": "Application Control",
        },
    ],

    "PROC-004": [
        {
            "id": "CTRL-END-001",
            "name": "Endpoint Detection and Response",
        },
    ],

    "PROC-005": [
        {
            "id": "CTRL-END-004",
            "name": "Persistence Monitoring",
        },
    ],

    # Malware
    "MAL-001": [
        {
            "id": "CTRL-END-001",
            "name": "Endpoint Detection and Response",
        },
    ],

    "MAL-002": [
        {
            "id": "CTRL-END-005",
            "name": "Malware Protection",
        },
        {
            "id": "CTRL-END-006",
            "name": "Threat Intelligence",
        },
    ],

    "MAL-003": [
        {
            "id": "CTRL-END-005",
            "name": "Malware Protection",
        },
    ],

    "MAL-004": [
        {
            "id": "CTRL-END-004",
            "name": "Persistence Monitoring",
        },
    ],

    # Phishing
    "PHISH-001": [
        {
            "id": "CTRL-EMAIL-001",
            "name": "Email Security",
        },
        {
            "id": "CTRL-AWARE-001",
            "name": "Phishing Awareness",
        },
    ],

    "PHISH-002": [
        {
            "id": "CTRL-EMAIL-001",
            "name": "Email Security",
        },
        {
            "id": "CTRL-AWARE-001",
            "name": "Phishing Awareness",
        },
    ],

    "PHISH-003": [
        {
            "id": "CTRL-WEB-001",
            "name": "Web Security Monitoring",
        },
        {
            "id": "CTRL-AUTH-002",
            "name": "Multi-Factor Authentication",
        },
    ],

    "PHISH-004": [
        {
            "id": "CTRL-EMAIL-001",
            "name": "Email Security",
        },
    ],

    # Web
    "WEB-001": [
        {
            "id": "CTRL-WEB-002",
            "name": "Input Validation",
        },
        {
            "id": "CTRL-WEB-003",
            "name": "Web Application Firewall",
        },
    ],

    "WEB-002": [
        {
            "id": "CTRL-WEB-002",
            "name": "Input Validation",
        },
        {
            "id": "CTRL-WEB-003",
            "name": "Web Application Firewall",
        },
    ],

    "WEB-003": [
        {
            "id": "CTRL-WEB-002",
            "name": "Input Validation",
        },
        {
            "id": "CTRL-WEB-003",
            "name": "Web Application Firewall",
        },
    ],

    "WEB-004": [
        {
            "id": "CTRL-WEB-004",
            "name": "Web Access Monitoring",
        },
        {
            "id": "CTRL-NET-001",
            "name": "Network Monitoring",
        },
    ],
}


# ============================================================
# RISK SCORING
# ============================================================

SEVERITY_BASE_SCORE = {
    "critical": 90,
    "high": 75,
    "medium": 50,
    "low": 25,
}


def calculate_risk_score(
    severity: str,
    event_count: int,
    ioc_count: int,
    mitre_count: int,
    asset_criticality: str | None = None,
) -> int:
    """
    Calculate an initial AEGIS risk score.

    This is an explainable heuristic for the portfolio
    prototype, not a certified enterprise risk methodology.
    """

    score = SEVERITY_BASE_SCORE.get(
        severity.lower(),
        25,
    )

    # Event volume contribution
    score += min(
        max(event_count - 1, 0),
        10,
    )

    # IOC contribution
    score += min(
        ioc_count * 2,
        10,
    )

    # MITRE coverage contribution
    score += min(
        mitre_count * 2,
        5,
    )

    # Asset criticality contribution
    criticality_bonus = {
        "critical": 10,
        "high": 7,
        "medium": 4,
        "low": 0,
    }

    if asset_criticality:
        score += criticality_bonus.get(
            asset_criticality.lower(),
            0,
        )

    return min(score, 100)


def determine_risk_level(score: int) -> str:

    if score >= 90:
        return "critical"

    if score >= 75:
        return "high"

    if score >= 50:
        return "medium"

    return "low"


# ============================================================
# IOC EXTRACTION
# ============================================================

def extract_iocs(
    events: list[SecurityEvent],
) -> list[dict]:
    """
    Extract useful investigation indicators from
    security event fields and raw telemetry.
    """

    iocs = []
    seen = set()

    def add_ioc(
        ioc_type: str,
        value: str,
        source_event_id: str,
    ):
        key = (
            ioc_type,
            value,
        )

        if key in seen:
            return

        seen.add(key)

        iocs.append(
            {
                "type": ioc_type,
                "value": value,
                "source_event_id": source_event_id,
            }
        )

    for event in events:

        event_id = str(event.id)

        if event.source_ip:
            add_ioc(
                "ipv4",
                event.source_ip,
                event_id,
            )

        raw_data = event.raw_data or {}

        if not isinstance(raw_data, dict):
            continue

        # ----------------------------------------------------
        # Common IOC fields
        # ----------------------------------------------------

        for key in (
            "sha256",
            "sha1",
            "md5",
            "file_hash",
        ):
            value = raw_data.get(key)

            if value:
                add_ioc(
                    "file_hash",
                    str(value),
                    event_id,
                )

        for key in (
            "url",
            "domain",
            "sender_domain",
        ):
            value = raw_data.get(key)

            if value:
                add_ioc(
                    key,
                    str(value),
                    event_id,
                )

        for key in (
            "destination_ip",
            "remote_ip",
        ):
            value = raw_data.get(key)

            if value:
                add_ioc(
                    "ipv4",
                    str(value),
                    event_id,
                )

    return iocs


# ============================================================
# BUILD ENRICHMENT
# ============================================================

def enrich_incident(
    db: Session,
    incident: Incident,
) -> IncidentEnrichment:
    """
    Generate or refresh automatic enrichment for an incident.
    """

    alert = (
        db.query(Alert)
        .filter(
            Alert.id == incident.alert_id
        )
        .first()
    )

    if not alert:
        raise ValueError(
            "Incident is not linked to a valid alert."
        )

    # --------------------------------------------------------
    # Related security events
    # --------------------------------------------------------

    start_time = (
        alert.created_at
        - timedelta(minutes=10)
    )

    query = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.asset_id == incident.asset_id,
            SecurityEvent.timestamp >= start_time,
            SecurityEvent.timestamp <= alert.created_at,
        )
    )

    if incident.source_ip:
        query = query.filter(
            SecurityEvent.source_ip
            == incident.source_ip
        )

    if incident.username:
        query = query.filter(
            SecurityEvent.username
            == incident.username
        )

    events = (
        query
        .order_by(
            SecurityEvent.timestamp.asc()
        )
        .all()
    )

    # --------------------------------------------------------
    # IOCs
    # --------------------------------------------------------

    iocs = extract_iocs(events)

    # --------------------------------------------------------
    # MITRE ATT&CK
    # --------------------------------------------------------

    mitre_techniques = MITRE_RULE_MAPPING.get(
        alert.rule_id,
        [],
    )

    # --------------------------------------------------------
    # Recommended controls
    # --------------------------------------------------------

    recommended_controls = CONTROL_MAPPING.get(
        alert.rule_id,
        [],
    )

    # --------------------------------------------------------
    # Asset criticality
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

    asset_criticality = (
        asset.criticality
        if asset
        else None
    )

    # --------------------------------------------------------
    # Risk score
    # --------------------------------------------------------

    risk_score = calculate_risk_score(
        severity=incident.severity,
        event_count=max(
            alert.event_count,
            len(events),
        ),
        ioc_count=len(iocs),
        mitre_count=len(mitre_techniques),
        asset_criticality=asset_criticality,
    )

    risk_level = determine_risk_level(
        risk_score
    )

    # --------------------------------------------------------
    # Existing enrichment
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

        enrichment = IncidentEnrichment(
            incident_id=incident.id,
        )

        db.add(enrichment)

    # --------------------------------------------------------
    # Update enrichment
    # --------------------------------------------------------

    enrichment.related_event_count = len(events)

    enrichment.related_event_ids = [
        str(event.id)
        for event in events
    ]

    enrichment.iocs = iocs

    enrichment.mitre_techniques = (
        mitre_techniques
    )

    enrichment.recommended_controls = (
        recommended_controls
    )

    enrichment.risk_score = risk_score

    enrichment.risk_level = risk_level

    enrichment.enrichment_version = "1.0"

    db.commit()
    db.refresh(enrichment)

    return enrichment