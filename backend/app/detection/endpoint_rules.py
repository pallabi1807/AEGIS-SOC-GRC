from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.security_event import SecurityEvent
from app.services.audit_service import record_audit_event


# ============================================================
# ENDPOINT / PROCESS DETECTION RULES
# ============================================================
#
# PROC-001  Suspicious PowerShell Execution
# PROC-002  Suspicious Command Shell Execution
# PROC-003  LOLBin Abuse
# PROC-004  Suspicious Process Spawn
# PROC-005  Persistence Command
#
# All rules return:
#     (created_alerts, updated_alerts)
#
# The simulator generates telemetry only.
# No suspicious command is actually executed.
# ============================================================


ACTIVE_ALERT_STATUSES = ["open", "investigating"]


# ------------------------------------------------------------
# Common helpers
# ------------------------------------------------------------

def get_current_utc_time() -> datetime:
    """Return current UTC time as a timezone-naive datetime."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_active_alert(
    db: Session,
    rule_id: str,
    asset_id,
    username: str | None = None,
    source_ip: str | None = None,
):
    """Find an existing active alert for the same context."""

    query = (
        db.query(Alert)
        .filter(
            Alert.rule_id == rule_id,
            Alert.asset_id == asset_id,
            Alert.status.in_(ACTIVE_ALERT_STATUSES),
        )
    )

    if username is not None:
        query = query.filter(Alert.username == username)

    if source_ip is not None:
        query = query.filter(Alert.source_ip == source_ip)

    return query.first()


def create_or_update_alert(
    db: Session,
    *,
    rule_id: str,
    title: str,
    description: str,
    severity: str,
    asset_id,
    username: str | None,
    source_ip: str | None,
    event_count: int,
):
    """Create a new alert or update an existing active alert."""

    existing_alert = get_active_alert(
        db=db,
        rule_id=rule_id,
        asset_id=asset_id,
        username=username,
        source_ip=source_ip,
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
        username=username,
        source_ip=source_ip,
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
# PROC-001
# Suspicious PowerShell Execution
# ============================================================

PROC001_RULE_ID = "PROC-001"
PROC001_TITLE = "Suspicious PowerShell Execution"

PROC001_WINDOW_MINUTES = 5


def detect_suspicious_powershell(db: Session):
    """
    Detect suspicious PowerShell process execution.

    Indicators include:
        - powershell.exe
        - pwsh.exe
        - ExecutionPolicy Bypass
        - EncodedCommand
        - NoProfile
    """

    now = get_current_utc_time()
    window_start = now - timedelta(minutes=PROC001_WINDOW_MINUTES)

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "process_creation",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    created_alerts = []
    updated_alerts = []

    suspicious_keywords = [
        "powershell",
        "pwsh",
        "-executionpolicy bypass",
        "-encodedcommand",
        "-enc ",
        "-noprofile",
    ]

    for event in events:

        raw_data = event.raw_data or {}

        process_name = str(
            raw_data.get("process_name", "")
        ).lower()

        command_line = str(
            raw_data.get("command_line", "")
        ).lower()

        combined = f"{process_name} {command_line}"

        is_powershell = (
            "powershell" in process_name
            or "pwsh" in process_name
        )

        suspicious_indicator = any(
            keyword in combined
            for keyword in suspicious_keywords
        )

        if not is_powershell or not suspicious_indicator:
            continue

        description = (
            f"Suspicious PowerShell execution detected for user "
            f"'{event.username}'. "
            f"Process: {process_name}. "
            f"Command line contains potentially suspicious "
            f"PowerShell execution indicators."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=PROC001_RULE_ID,
            title=PROC001_TITLE,
            description=description,
            severity="high",
            asset_id=event.asset_id,
            username=event.username,
            source_ip=event.source_ip,
            event_count=1,
        )

        if created:
            created_alerts.append(created)

        if updated:
            updated_alerts.append(updated)

    return created_alerts, updated_alerts


# ============================================================
# PROC-002
# Suspicious Command Shell Execution
# ============================================================

PROC002_RULE_ID = "PROC-002"
PROC002_TITLE = "Suspicious Command Shell Execution"

PROC002_WINDOW_MINUTES = 5


def detect_suspicious_cmd(db: Session):
    """
    Detect suspicious Windows command-shell activity.

    Indicators include:
        - cmd.exe
        - whoami
        - net user
        - net localgroup
        - ipconfig
        - tasklist
        - systeminfo
    """

    now = get_current_utc_time()
    window_start = now - timedelta(minutes=PROC002_WINDOW_MINUTES)

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "process_creation",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    suspicious_commands = [
        "whoami",
        "net user",
        "net localgroup",
        "ipconfig",
        "tasklist",
        "systeminfo",
    ]

    created_alerts = []
    updated_alerts = []

    for event in events:

        raw_data = event.raw_data or {}

        process_name = str(
            raw_data.get("process_name", "")
        ).lower()

        command_line = str(
            raw_data.get("command_line", "")
        ).lower()

        if process_name != "cmd.exe":
            continue

        matched_commands = [
            command
            for command in suspicious_commands
            if command in command_line
        ]

        if not matched_commands:
            continue

        description = (
            f"Suspicious command-shell activity detected for "
            f"user '{event.username}'. "
            f"Process: cmd.exe. "
            f"Detected commands: {', '.join(matched_commands)}."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=PROC002_RULE_ID,
            title=PROC002_TITLE,
            description=description,
            severity="medium",
            asset_id=event.asset_id,
            username=event.username,
            source_ip=event.source_ip,
            event_count=1,
        )

        if created:
            created_alerts.append(created)

        if updated:
            updated_alerts.append(updated)

    return created_alerts, updated_alerts


# ============================================================
# PROC-003
# LOLBin Abuse
# ============================================================

PROC003_RULE_ID = "PROC-003"
PROC003_TITLE = "Potential LOLBin Abuse"

PROC003_WINDOW_MINUTES = 5


def detect_lolbin_abuse(db: Session):
    """
    Detect potentially suspicious use of legitimate Windows
    binaries commonly associated with living-off-the-land
    techniques.

    Monitored binaries:
        - certutil.exe
        - mshta.exe
        - regsvr32.exe
        - rundll32.exe
        - bitsadmin.exe
    """

    now = get_current_utc_time()
    window_start = now - timedelta(minutes=PROC003_WINDOW_MINUTES)

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "process_creation",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    lolbins = {
        "certutil.exe",
        "mshta.exe",
        "regsvr32.exe",
        "rundll32.exe",
        "bitsadmin.exe",
    }

    created_alerts = []
    updated_alerts = []

    for event in events:

        raw_data = event.raw_data or {}

        process_name = str(
            raw_data.get("process_name", "")
        ).lower()

        command_line = str(
            raw_data.get("command_line", "")
        ).lower()

        if process_name not in lolbins:
            continue

        description = (
            f"Potential LOLBin abuse detected for user "
            f"'{event.username}'. "
            f"Process '{process_name}' was executed. "
            f"Command line: {command_line}"
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=PROC003_RULE_ID,
            title=PROC003_TITLE,
            description=description,
            severity="high",
            asset_id=event.asset_id,
            username=event.username,
            source_ip=event.source_ip,
            event_count=1,
        )

        if created:
            created_alerts.append(created)

        if updated:
            updated_alerts.append(updated)

    return created_alerts, updated_alerts


# ============================================================
# PROC-004
# Suspicious Process Spawn
# ============================================================

PROC004_RULE_ID = "PROC-004"
PROC004_TITLE = "Suspicious Process Spawn"

PROC004_WINDOW_MINUTES = 5


def detect_suspicious_process_spawn(db: Session):
    """
    Detect suspicious parent-child process relationships.

    Examples:
        Word/Excel -> PowerShell
        Word/Excel -> cmd.exe
        browser -> PowerShell
        browser -> cmd.exe
    """

    now = get_current_utc_time()
    window_start = now - timedelta(minutes=PROC004_WINDOW_MINUTES)

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "process_creation",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    suspicious_parents = {
        "winword.exe",
        "excel.exe",
        "outlook.exe",
        "chrome.exe",
        "msedge.exe",
        "firefox.exe",
    }

    suspicious_children = {
        "powershell.exe",
        "pwsh.exe",
        "cmd.exe",
        "wscript.exe",
        "cscript.exe",
        "mshta.exe",
    }

    created_alerts = []
    updated_alerts = []

    for event in events:

        raw_data = event.raw_data or {}

        parent_process = str(
            raw_data.get("parent_process", "")
        ).lower()

        child_process = str(
            raw_data.get("process_name", "")
        ).lower()

        if parent_process not in suspicious_parents:
            continue

        if child_process not in suspicious_children:
            continue

        description = (
            f"Suspicious process relationship detected. "
            f"Parent process '{parent_process}' spawned "
            f"child process '{child_process}' "
            f"for user '{event.username}'."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=PROC004_RULE_ID,
            title=PROC004_TITLE,
            description=description,
            severity="high",
            asset_id=event.asset_id,
            username=event.username,
            source_ip=event.source_ip,
            event_count=1,
        )

        if created:
            created_alerts.append(created)

        if updated:
            updated_alerts.append(updated)

    return created_alerts, updated_alerts


# ============================================================
# PROC-005
# Persistence Command
# ============================================================

PROC005_RULE_ID = "PROC-005"
PROC005_TITLE = "Potential Persistence Command"

PROC005_WINDOW_MINUTES = 5


def detect_persistence_command(db: Session):
    """
    Detect process telemetry containing common persistence
    mechanisms.

    Indicators include:
        - schtasks
        - scheduled task creation
        - registry Run keys
        - startup folder references
        - service creation
    """

    now = get_current_utc_time()
    window_start = now - timedelta(minutes=PROC005_WINDOW_MINUTES)

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "process_creation",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    persistence_indicators = [
        "schtasks",
        "/create",
        "currentversion\\run",
        "\\startup\\",
        "sc create",
        "new-service",
        "new-service",
    ]

    created_alerts = []
    updated_alerts = []

    for event in events:

        raw_data = event.raw_data or {}

        process_name = str(
            raw_data.get("process_name", "")
        ).lower()

        command_line = str(
            raw_data.get("command_line", "")
        ).lower()

        combined = f"{process_name} {command_line}"

        matched_indicators = [
            indicator
            for indicator in persistence_indicators
            if indicator in combined
        ]

        if not matched_indicators:
            continue

        description = (
            f"Potential persistence activity detected for "
            f"user '{event.username}'. "
            f"Process: {process_name}. "
            f"Indicators: {', '.join(matched_indicators)}."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=PROC005_RULE_ID,
            title=PROC005_TITLE,
            description=description,
            severity="high",
            asset_id=event.asset_id,
            username=event.username,
            source_ip=event.source_ip,
            event_count=1,
        )

        if created:
            created_alerts.append(created)

        if updated:
            updated_alerts.append(updated)

    return created_alerts, updated_alerts