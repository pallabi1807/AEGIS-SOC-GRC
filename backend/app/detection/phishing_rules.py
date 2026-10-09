from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.security_event import SecurityEvent
from app.services.audit_service import record_audit_event

# ============================================================
# PHISHING DETECTION RULES
# ============================================================
#
# PHISH-001  Suspicious Email Link
# PHISH-002  Malicious Attachment
# PHISH-003  Credential Harvesting Page
# PHISH-004  Suspicious Sender / Domain
#
# All rules return:
#
#     (created_alerts, updated_alerts)
#
# Existing active alerts are updated instead of creating
# duplicate alerts.
# ============================================================


# ------------------------------------------------------------
# Common helpers
# ------------------------------------------------------------

ACTIVE_ALERT_STATUSES = [
    "open",
    "investigating",
]


def get_current_utc_time() -> datetime:
    """
    Return the current UTC time as a timezone-naive datetime.
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
    Find an existing active alert for the same detection context.
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
# PHISH-001
# Suspicious Email Link
# ============================================================

PHISH001_RULE_ID = "PHISH-001"
PHISH001_TITLE = "Suspicious Email Link"

PHISH001_WINDOW_MINUTES = 5

PHISH001_SUSPICIOUS_INDICATORS = [
    "http://",
    "https://",
    "login",
    "verify",
    "verification",
    "account",
    "secure",
    "password",
    "update",
    "signin",
]


def detect_suspicious_email_link(
    db: Session,
):
    """
    Detect suspicious links contained in email telemetry.

    Trigger:
        An email_link event contains suspicious URL or
        credential-related indicators.
    """

    now = get_current_utc_time()

    window_start = now - timedelta(
        minutes=PHISH001_WINDOW_MINUTES
    )

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "email_link",
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

        link_text = str(
            raw_data.get("link_text", "")
        ).lower()

        combined = f"{url} {link_text}"

        matched_indicators = [
            indicator
            for indicator in PHISH001_SUSPICIOUS_INDICATORS
            if indicator in combined
        ]

        if not matched_indicators:
            continue

        description = (
            f"Suspicious email link detected for user "
            f"'{event.username}'. "
            f"Matched indicators: "
            f"{', '.join(matched_indicators)}."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=PHISH001_RULE_ID,
            title=PHISH001_TITLE,
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
# PHISH-002
# Malicious Attachment
# ============================================================

PHISH002_RULE_ID = "PHISH-002"
PHISH002_TITLE = "Malicious Email Attachment"

PHISH002_WINDOW_MINUTES = 5

PHISH002_SUSPICIOUS_EXTENSIONS = [
    ".exe",
    ".scr",
    ".bat",
    ".cmd",
    ".vbs",
    ".js",
    ".hta",
    ".ps1",
    ".dll",
]


def detect_malicious_attachment(
    db: Session,
):
    """
    Detect suspicious email attachments.

    Trigger:
        An email_attachment event contains a suspicious
        executable or script extension.
    """

    now = get_current_utc_time()

    window_start = now - timedelta(
        minutes=PHISH002_WINDOW_MINUTES
    )

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "email_attachment",
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

        file_name = str(
            raw_data.get("file_name", "")
        ).lower()

        matched_extension = None

        for extension in PHISH002_SUSPICIOUS_EXTENSIONS:

            if file_name.endswith(extension):
                matched_extension = extension
                break

        if not matched_extension:
            continue

        description = (
            f"Suspicious email attachment detected for "
            f"user '{event.username}'. "
            f"File: {file_name}. "
            f"Extension: {matched_extension}."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=PHISH002_RULE_ID,
            title=PHISH002_TITLE,
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
# PHISH-003
# Credential Harvesting Page
# ============================================================

PHISH003_RULE_ID = "PHISH-003"
PHISH003_TITLE = "Credential Harvesting Page"

PHISH003_WINDOW_MINUTES = 5

PHISH003_INDICATORS = [
    "login",
    "signin",
    "password",
    "credential",
    "verify-account",
    "account-verification",
    "secure-login",
]


def detect_credential_harvesting_page(
    db: Session,
):
    """
    Detect simulated browser telemetry indicating a
    credential harvesting page.

    Trigger:
        A web_navigation event contains credential-related
        page indicators and the page is classified as suspicious.
    """

    now = get_current_utc_time()

    window_start = now - timedelta(
        minutes=PHISH003_WINDOW_MINUTES
    )

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "web_navigation",
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

        page_title = str(
            raw_data.get("page_title", "")
        ).lower()

        page_classification = str(
            raw_data.get("page_classification", "")
        ).lower()

        combined = (
            f"{url} "
            f"{page_title} "
            f"{page_classification}"
        )

        if page_classification != "credential_harvesting":
            continue

        matched_indicators = [
            indicator
            for indicator in PHISH003_INDICATORS
            if indicator in combined
        ]

        if not matched_indicators:
            continue

        description = (
            f"Potential credential harvesting page "
            f"visited by user '{event.username}'. "
            f"Matched indicators: "
            f"{', '.join(matched_indicators)}."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=PHISH003_RULE_ID,
            title=PHISH003_TITLE,
            description=description,
            severity="critical",
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
# PHISH-004
# Suspicious Sender / Domain
# ============================================================

PHISH004_RULE_ID = "PHISH-004"
PHISH004_TITLE = "Suspicious Sender or Domain"

PHISH004_WINDOW_MINUTES = 5

PHISH004_SUSPICIOUS_INDICATORS = [
    "verify",
    "security-alert",
    "account",
    "support",
    "login",
    "payment",
    "invoice",
    "urgent",
]


def detect_suspicious_sender_domain(
    db: Session,
):
    """
    Detect suspicious sender or domain indicators in
    simulated email telemetry.
    """

    now = get_current_utc_time()

    window_start = now - timedelta(
        minutes=PHISH004_WINDOW_MINUTES
    )

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "email_received",
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

        sender = str(
            raw_data.get("sender", "")
        ).lower()

        sender_domain = str(
            raw_data.get("sender_domain", "")
        ).lower()

        subject = str(
            raw_data.get("subject", "")
        ).lower()

        combined = (
            f"{sender} "
            f"{sender_domain} "
            f"{subject}"
        )

        matched_indicators = [
            indicator
            for indicator in PHISH004_SUSPICIOUS_INDICATORS
            if indicator in combined
        ]

        if not matched_indicators:
            continue

        description = (
            f"Suspicious email sender or domain detected "
            f"for user '{event.username}'. "
            f"Sender: {sender}. "
            f"Domain: {sender_domain}. "
            f"Matched indicators: "
            f"{', '.join(matched_indicators)}."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=PHISH004_RULE_ID,
            title=PHISH004_TITLE,
            description=description,
            severity="medium",
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