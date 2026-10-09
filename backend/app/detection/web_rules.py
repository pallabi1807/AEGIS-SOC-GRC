from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.security_event import SecurityEvent
from app.services.audit_service import record_audit_event

# ============================================================
# WEB APPLICATION DETECTION RULES
# ============================================================
#
# WEB-001  SQL Injection Attempt
# WEB-002  Cross-Site Scripting Attempt
# WEB-003  Directory Traversal
# WEB-004  Web Scanner / Enumeration
#
# These rules process simulated web telemetry.
# They do not perform any real-world scanning or exploitation.
# ============================================================


ACTIVE_ALERT_STATUSES = [
    "open",
    "investigating",
]


# ------------------------------------------------------------
# Common helpers
# ------------------------------------------------------------

def get_current_utc_time() -> datetime:
    """
    Return current UTC time as a timezone-naive datetime.
    """

    return datetime.now(timezone.utc).replace(
        tzinfo=None
    )


def get_active_alert(
    db: Session,
    rule_id: str,
    asset_id,
    source_ip: str | None = None,
    username: str | None = None,
):
    """
    Find an existing active alert for the same
    detection context.
    """

    query = (
        db.query(Alert)
        .filter(
            Alert.rule_id == rule_id,
            Alert.asset_id == asset_id,
            Alert.status.in_(ACTIVE_ALERT_STATUSES),
        )
    )

    if source_ip is not None:
        query = query.filter(
            Alert.source_ip == source_ip
        )

    if username is not None:
        query = query.filter(
            Alert.username == username
        )

    return query.first()


def create_or_update_alert(
    db: Session,
    *,
    rule_id: str,
    title: str,
    description: str,
    severity: str,
    asset_id,
    source_ip: str | None,
    username: str | None,
    event_count: int,
):
    """
    Create a new alert or update an existing active alert.
    """

    existing_alert = get_active_alert(
        db=db,
        rule_id=rule_id,
        asset_id=asset_id,
        source_ip=source_ip,
        username=username,
    )

    if existing_alert:

        existing_alert.event_count = event_count
        existing_alert.description = description
        existing_alert.severity = severity

        db.commit()
        db.refresh(existing_alert)

        return None, existing_alert

    alert = Alert(
        rule_id=rule_id,
        title=title,
        description=description,
        severity=severity,
        status="open",
        asset_id=asset_id,
        source_ip=source_ip,
        username=username,
        event_count=event_count,
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    record_audit_event(
        db=db,
        actor="system",
        action="ALERT_CREATED",
        entity_type="Alert",
        entity_id=alert.id,
        description=(
            f"Alert created by detection rule "
            f"{alert.rule_id}: {alert.title}."
        ),
        old_value=None,
        new_value=alert.status,
        source="detection",
    )

    return alert, None


# ============================================================
# WEB-001
# SQL INJECTION ATTEMPT
# ============================================================

WEB001_RULE_ID = "WEB-001"
WEB001_TITLE = "SQL Injection Attempt"

WEB001_WINDOW_MINUTES = 5

WEB001_INDICATORS = [
    "' or '1'='1",
    "' or 1=1",
    "or 1=1",
    "union select",
    "union all select",
    "select * from",
    "information_schema",
    "drop table",
    "insert into",
    "sleep(",
    "benchmark(",
]


def detect_sql_injection(
    db: Session,
):
    """
    Detect SQL injection indicators in simulated
    HTTP request telemetry.
    """

    now = get_current_utc_time()

    window_start = now - timedelta(
        minutes=WEB001_WINDOW_MINUTES
    )

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "web_request",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    created_alerts = []
    updated_alerts = []

    for event in events:

        raw_data = event.raw_data or {}

        url = str(
            raw_data.get("url", "")
        ).lower()

        query_string = str(
            raw_data.get("query_string", "")
        ).lower()

        request_body = str(
            raw_data.get("request_body", "")
        ).lower()

        combined = (
            f"{url} "
            f"{query_string} "
            f"{request_body}"
        )

        matched_indicators = [
            indicator
            for indicator in WEB001_INDICATORS
            if indicator in combined
        ]

        if not matched_indicators:
            continue

        description = (
            "Potential SQL injection attempt detected "
            f"against web asset. "
            f"Matched indicators: "
            f"{', '.join(matched_indicators)}."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=WEB001_RULE_ID,
            title=WEB001_TITLE,
            description=description,
            severity="high",
            asset_id=event.asset_id,
            source_ip=event.source_ip,
            username=event.username,
            event_count=1,
        )

        if created:
            created_alerts.append(created)

        if updated:
            updated_alerts.append(updated)

    return created_alerts, updated_alerts


# ============================================================
# WEB-002
# CROSS-SITE SCRIPTING ATTEMPT
# ============================================================

WEB002_RULE_ID = "WEB-002"
WEB002_TITLE = "Cross-Site Scripting Attempt"

WEB002_WINDOW_MINUTES = 5

WEB002_INDICATORS = [
    "<script",
    "</script>",
    "javascript:",
    "onerror=",
    "onload=",
    "onclick=",
    "alert(",
    "document.cookie",
    "document.location",
]


def detect_xss_attempt(
    db: Session,
):
    """
    Detect common XSS indicators in simulated
    HTTP request telemetry.
    """

    now = get_current_utc_time()

    window_start = now - timedelta(
        minutes=WEB002_WINDOW_MINUTES
    )

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "web_request",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    created_alerts = []
    updated_alerts = []

    for event in events:

        raw_data = event.raw_data or {}

        url = str(
            raw_data.get("url", "")
        ).lower()

        query_string = str(
            raw_data.get("query_string", "")
        ).lower()

        request_body = str(
            raw_data.get("request_body", "")
        ).lower()

        combined = (
            f"{url} "
            f"{query_string} "
            f"{request_body}"
        )

        matched_indicators = [
            indicator
            for indicator in WEB002_INDICATORS
            if indicator in combined
        ]

        if not matched_indicators:
            continue

        description = (
            "Potential cross-site scripting attempt "
            "detected in web request. "
            f"Matched indicators: "
            f"{', '.join(matched_indicators)}."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=WEB002_RULE_ID,
            title=WEB002_TITLE,
            description=description,
            severity="high",
            asset_id=event.asset_id,
            source_ip=event.source_ip,
            username=event.username,
            event_count=1,
        )

        if created:
            created_alerts.append(created)

        if updated:
            updated_alerts.append(updated)

    return created_alerts, updated_alerts


# ============================================================
# WEB-003
# DIRECTORY TRAVERSAL
# ============================================================

WEB003_RULE_ID = "WEB-003"
WEB003_TITLE = "Directory Traversal Attempt"

WEB003_WINDOW_MINUTES = 5

WEB003_INDICATORS = [
    "../",
    "..\\",
    "%2e%2e%2f",
    "%2e%2e/",
    "..%2f",
    "%2e%2e%5c",
    "..%5c",
]


def detect_directory_traversal(
    db: Session,
):
    """
    Detect directory traversal indicators in simulated
    HTTP request telemetry.
    """

    now = get_current_utc_time()

    window_start = now - timedelta(
        minutes=WEB003_WINDOW_MINUTES
    )

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "web_request",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    created_alerts = []
    updated_alerts = []

    for event in events:

        raw_data = event.raw_data or {}

        url = str(
            raw_data.get("url", "")
        ).lower()

        query_string = str(
            raw_data.get("query_string", "")
        ).lower()

        combined = (
            f"{url} "
            f"{query_string}"
        )

        matched_indicators = [
            indicator
            for indicator in WEB003_INDICATORS
            if indicator in combined
        ]

        if not matched_indicators:
            continue

        description = (
            "Potential directory traversal attempt "
            "detected in web request. "
            f"Matched indicators: "
            f"{', '.join(matched_indicators)}."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=WEB003_RULE_ID,
            title=WEB003_TITLE,
            description=description,
            severity="high",
            asset_id=event.asset_id,
            source_ip=event.source_ip,
            username=event.username,
            event_count=1,
        )

        if created:
            created_alerts.append(created)

        if updated:
            updated_alerts.append(updated)

    return created_alerts, updated_alerts


# ============================================================
# WEB-004
# WEB SCANNER / ENUMERATION
# ============================================================

WEB004_RULE_ID = "WEB-004"
WEB004_TITLE = "Web Scanner / Enumeration Detected"

WEB004_WINDOW_MINUTES = 5
WEB004_THRESHOLD = 10


def detect_web_scanner(
    db: Session,
):
    """
    Detect high-volume web enumeration activity.

    Trigger:
        At least WEB004_THRESHOLD web requests from the
        same source IP against the same asset within
        the detection window.
    """

    now = get_current_utc_time()

    window_start = now - timedelta(
        minutes=WEB004_WINDOW_MINUTES
    )

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "web_request",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
            SecurityEvent.source_ip.isnot(None),
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    grouped_events = {}

    for event in events:

        key = (
            str(event.asset_id),
            event.source_ip,
        )

        grouped_events.setdefault(
            key,
            [],
        ).append(event)

    created_alerts = []
    updated_alerts = []

    for (
        asset_id,
        source_ip,
    ), grouped in grouped_events.items():

        event_count = len(grouped)

        if event_count < WEB004_THRESHOLD:
            continue

        description = (
            "High-volume web request activity detected "
            f"from source IP {source_ip}. "
            f"Observed {event_count} requests within "
            f"{WEB004_WINDOW_MINUTES} minutes."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=WEB004_RULE_ID,
            title=WEB004_TITLE,
            description=description,
            severity="medium",
            asset_id=asset_id,
            source_ip=source_ip,
            username=None,
            event_count=event_count,
        )

        if created:
            created_alerts.append(created)

        if updated:
            updated_alerts.append(updated)

    return created_alerts, updated_alerts