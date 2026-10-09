from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.security_event import SecurityEvent
from app.services.audit_service import record_audit_event

# ============================================================
# NETWORK DETECTION RULES
# ============================================================
#
# NET-001  Port Scan
# NET-002  Repeated Connection Attempts
# NET-003  Unusual Destination Port
# NET-004  High Volume Network Connections
# NET-005  Unknown External Destination
#
# All rules return:
#
#     (created_alerts, updated_alerts)
#
# ============================================================


ACTIVE_ALERT_STATUSES = [
    "open",
    "investigating",
]


# ============================================================
# COMMON HELPERS
# ============================================================

def get_current_utc_time() -> datetime:
    """
    Return the current UTC time as a timezone-naive datetime.

    The database currently stores timestamps in naive UTC format.
    """

    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_active_alert(
    db: Session,
    *,
    rule_id: str,
    asset_id,
    source_ip: str | None = None,
    username: str | None = None,
):
    """
    Find an active alert using the supplied detection context.
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
        db,
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
# NET-001
# PORT SCAN
# ============================================================

NET001_RULE_ID = "NET-001"
NET001_TITLE = "Port Scan Detected"

NET001_THRESHOLD = 8
NET001_WINDOW_MINUTES = 5


def detect_port_scan(db: Session):

    now = get_current_utc_time()

    window_start = (
        now -
        timedelta(minutes=NET001_WINDOW_MINUTES)
    )

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "network_connection",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    grouped_events = {}

    for event in events:

        raw_data = event.raw_data or {}

        destination_port = raw_data.get(
            "destination_port"
        )

        if destination_port is None:
            continue

        key = (
            event.asset_id,
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
    ), matching_events in grouped_events.items():

        unique_ports = {
            (
                event.raw_data or {}
            ).get("destination_port")
            for event in matching_events
        }

        unique_ports.discard(None)

        if len(unique_ports) < NET001_THRESHOLD:
            continue

        description = (
            f"Source IP {source_ip} attempted "
            f"connections to {len(unique_ports)} "
            f"unique destination ports within "
            f"{NET001_WINDOW_MINUTES} minutes."
        )

        created, updated = create_or_update_alert(
            db,
            rule_id=NET001_RULE_ID,
            title=NET001_TITLE,
            description=description,
            severity="high",
            asset_id=asset_id,
            source_ip=source_ip,
            username=None,
            event_count=len(matching_events),
        )

        if created:
            created_alerts.append(created)

        if updated:
            updated_alerts.append(updated)

    return created_alerts, updated_alerts


# ============================================================
# NET-002
# REPEATED CONNECTION ATTEMPTS
# ============================================================

NET002_RULE_ID = "NET-002"
NET002_TITLE = "Repeated Connection Attempts"

NET002_THRESHOLD = 10
NET002_WINDOW_MINUTES = 5


def detect_repeated_connection_attempts(db: Session):

    now = get_current_utc_time()

    window_start = (
        now -
        timedelta(minutes=NET002_WINDOW_MINUTES)
    )

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "network_connection",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    # --------------------------------------------------------
    # IMPORTANT:
    #
    # NET-002 uses the complete connection context:
    #
    # asset
    # source IP
    # destination IP
    # destination port
    #
    # This prevents NET-004 traffic from being incorrectly
    # interpreted as NET-002.
    # --------------------------------------------------------

    grouped_events = {}

    for event in events:

        raw_data = event.raw_data or {}

        destination_ip = raw_data.get(
            "destination_ip"
        )

        destination_port = raw_data.get(
            "destination_port"
        )

        if not destination_ip:
            continue

        if destination_port is None:
            continue

        key = (
            event.asset_id,
            event.source_ip,
            destination_ip,
            destination_port,
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
        destination_ip,
        destination_port,
    ), matching_events in grouped_events.items():

        event_count = len(matching_events)
        # --------------------------------------------------------
# NET-002 handles repeated connection attempts.
#
# NET-004 handles high-volume traffic (50+ events).
# Keeping the ranges separate makes the simulator
# scenarios distinct and prevents overlapping alerts.
# --------------------------------------------------------


        if event_count < NET002_THRESHOLD:
            continue
        if event_count >= NET004_THRESHOLD:
            continue

        description = (
            f"Repeated connection attempts detected "
            f"from {source_ip} to "
            f"{destination_ip}:{destination_port}. "
            f"{event_count} connection attempts observed "
            f"within {NET002_WINDOW_MINUTES} minutes."
        )

        created, updated = create_or_update_alert(
            db,
            rule_id=NET002_RULE_ID,
            title=NET002_TITLE,
            description=description,
            severity="high",
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


# ============================================================
# NET-003
# UNUSUAL DESTINATION PORT
# ============================================================

NET003_RULE_ID = "NET-003"
NET003_TITLE = "Unusual Destination Port"

UNUSUAL_PORTS = {
    4444,
    5555,
    1337,
    31337,
    9001,
}

NET003_WINDOW_MINUTES = 5


def detect_unusual_destination_port(db: Session):

    now = get_current_utc_time()

    window_start = (
        now -
        timedelta(minutes=NET003_WINDOW_MINUTES)
    )

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "network_connection",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    created_alerts = []
    updated_alerts = []

    # --------------------------------------------------------
    # Track unique detection contexts so the same alert isn't
    # repeatedly updated by identical events.
    # --------------------------------------------------------

    contexts = {}

    for event in events:

        raw_data = event.raw_data or {}

        destination_port = raw_data.get(
            "destination_port"
        )

        if destination_port not in UNUSUAL_PORTS:
            continue

        destination_ip = raw_data.get(
            "destination_ip",
            "unknown",
        )

        key = (
            event.asset_id,
            event.source_ip,
            destination_ip,
            destination_port,
        )

        contexts.setdefault(
            key,
            [],
        ).append(event)

    for (
        asset_id,
        source_ip,
        destination_ip,
        destination_port,
    ), matching_events in contexts.items():

        event_count = len(matching_events)

        description = (
            f"Connection from {source_ip} to "
            f"{destination_ip}:{destination_port} "
            f"uses an unusual destination port."
        )

        created, updated = create_or_update_alert(
            db,
            rule_id=NET003_RULE_ID,
            title=NET003_TITLE,
            description=description,
            severity="high",
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


# ============================================================
# NET-004
# HIGH VOLUME NETWORK CONNECTIONS
# ============================================================

NET004_RULE_ID = "NET-004"
NET004_TITLE = "High Volume Network Connections"

NET004_THRESHOLD = 50
NET004_WINDOW_MINUTES = 5


def detect_high_volume_connections(db: Session):

    now = get_current_utc_time()

    window_start = (
        now -
        timedelta(minutes=NET004_WINDOW_MINUTES)
    )

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "network_connection",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    grouped_events = {}

    for event in events:

        key = (
            event.asset_id,
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
    ), matching_events in grouped_events.items():

        event_count = len(matching_events)

        if event_count < NET004_THRESHOLD:
            continue

        description = (
            f"High volume network activity detected "
            f"from source IP {source_ip}. "
            f"{event_count} connections observed within "
            f"{NET004_WINDOW_MINUTES} minutes."
        )

        created, updated = create_or_update_alert(
            db,
            rule_id=NET004_RULE_ID,
            title=NET004_TITLE,
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


# ============================================================
# NET-005
# UNKNOWN EXTERNAL DESTINATION
# ============================================================

NET005_RULE_ID = "NET-005"
NET005_TITLE = "Connection To Unknown External Destination"

NET005_WINDOW_MINUTES = 5


def detect_external_destination(db: Session):

    now = get_current_utc_time()

    window_start = (
        now -
        timedelta(minutes=NET005_WINDOW_MINUTES)
    )

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "network_connection",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    contexts = {}

    for event in events:

        raw_data = event.raw_data or {}

        destination_external = raw_data.get(
            "destination_external"
        )

        known_destination = raw_data.get(
            "known_destination"
        )

        if destination_external is not True:
            continue

        if known_destination is True:
            continue

        destination_ip = raw_data.get(
            "destination_ip",
            "unknown",
        )

        destination_port = raw_data.get(
            "destination_port",
            "unknown",
        )

        key = (
            event.asset_id,
            event.source_ip,
            destination_ip,
            destination_port,
        )

        contexts.setdefault(
            key,
            [],
        ).append(event)

    created_alerts = []
    updated_alerts = []

    for (
        asset_id,
        source_ip,
        destination_ip,
        destination_port,
    ), matching_events in contexts.items():

        event_count = len(matching_events)

        description = (
            f"Connection from {source_ip} to "
            f"unknown external destination "
            f"{destination_ip}:{destination_port}."
        )

        created, updated = create_or_update_alert(
            db,
            rule_id=NET005_RULE_ID,
            title=NET005_TITLE,
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