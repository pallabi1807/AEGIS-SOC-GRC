from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.security_event import SecurityEvent
from app.services.audit_service import record_audit_event


# ============================================================
# AUTHENTICATION DETECTION RULES
# ============================================================
#
# AUTH-001  Multiple Failed Login Attempts
# AUTH-002  Successful Login After Repeated Failures
# AUTH-003  Login From New Source IP
# AUTH-004  Multiple Accounts Targeted From One Source IP
# AUTH-005  Privileged Account Login
#
# All rules return:
#     (created_alerts, updated_alerts)
#
# Existing active alerts are updated instead of creating
# duplicate alerts.
# ============================================================


# ------------------------------------------------------------
# Common helpers
# ------------------------------------------------------------

ACTIVE_ALERT_STATUSES = ["open", "investigating"]


def get_current_utc_time() -> datetime:
    """
    Return the current UTC time as a timezone-naive datetime.

    The project currently stores event timestamps as naive
    UTC datetimes, so detection rules use the same format.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


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
        query = query.filter(Alert.source_ip == source_ip)

    if username is not None:
        query = query.filter(Alert.username == username)

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
# AUTH-001
# Multiple Failed Login Attempts
# ============================================================

AUTH001_RULE_ID = "AUTH-001"
AUTH001_TITLE = "Multiple Failed Login Attempts"

AUTH001_THRESHOLD = 5
AUTH001_WINDOW_MINUTES = 5


def detect_multiple_failed_logins(db: Session):
    """
    Detect repeated failed login attempts from the same
    username and source IP against the same asset.

    Trigger:
        5 or more failed logins
        within 5 minutes.
    """

    now = get_current_utc_time()
    window_start = now - timedelta(minutes=AUTH001_WINDOW_MINUTES)

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "failed_login",
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
            event.username,
            event.source_ip,
        )

        grouped_events.setdefault(key, []).append(event)

    created_alerts = []
    updated_alerts = []

    for (asset_id, username, source_ip), matching_events in grouped_events.items():

        event_count = len(matching_events)

        if event_count < AUTH001_THRESHOLD:
            continue

        description = (
            f"{event_count} failed login attempts detected for "
            f"user '{username}' from source IP {source_ip} "
            f"within {AUTH001_WINDOW_MINUTES} minutes."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=AUTH001_RULE_ID,
            title=AUTH001_TITLE,
            description=description,
            severity="high",
            asset_id=asset_id,
            source_ip=source_ip,
            username=username,
            event_count=event_count,
        )

        if created:
            created_alerts.append(created)

        if updated:
            updated_alerts.append(updated)

    return created_alerts, updated_alerts


# ============================================================
# AUTH-002
# Successful Login After Repeated Failures
# ============================================================

AUTH002_RULE_ID = "AUTH-002"
AUTH002_TITLE = "Successful Login After Repeated Failures"

AUTH002_FAILED_THRESHOLD = 3
AUTH002_WINDOW_MINUTES = 5


def detect_success_after_failed_logins(db: Session):
    """
    Detect a successful login occurring after multiple failed
    login attempts from the same username, source IP and asset.

    Trigger:
        At least 3 failed logins followed by a successful login
        within 5 minutes.
    """

    now = get_current_utc_time()
    window_start = now - timedelta(minutes=AUTH002_WINDOW_MINUTES)

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type.in_(
                ["failed_login", "successful_login"]
            ),
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
            event.username,
            event.source_ip,
        )

        grouped_events.setdefault(key, []).append(event)

    created_alerts = []
    updated_alerts = []

    for (asset_id, username, source_ip), user_events in grouped_events.items():

        failed_count = 0

        for event in user_events:

            if event.event_type == "failed_login":
                failed_count += 1

            elif event.event_type == "successful_login":

                if failed_count >= AUTH002_FAILED_THRESHOLD:

                    description = (
                        f"Successful login detected for user '{username}' "
                        f"from source IP {source_ip} after "
                        f"{failed_count} failed login attempts "
                        f"within {AUTH002_WINDOW_MINUTES} minutes."
                    )

                    created, updated = create_or_update_alert(
                        db=db,
                        rule_id=AUTH002_RULE_ID,
                        title=AUTH002_TITLE,
                        description=description,
                        severity="high",
                        asset_id=asset_id,
                        source_ip=source_ip,
                        username=username,
                        event_count=failed_count + 1,
                    )

                    if created:
                        created_alerts.append(created)

                    if updated:
                        updated_alerts.append(updated)

                    break

    return created_alerts, updated_alerts


# ============================================================
# AUTH-003
# Login From New Source IP
# ============================================================

AUTH003_RULE_ID = "AUTH-003"
AUTH003_TITLE = "Login From New Source IP"

AUTH003_WINDOW_MINUTES = 5


def detect_new_source_ip(db: Session):
    """
    Detect a successful login from a source IP that has not
    previously been observed for the same username and asset.

    The first-ever login for a user is not considered anomalous
    because there is no historical source IP for comparison.
    """

    now = get_current_utc_time()
    window_start = now - timedelta(minutes=AUTH003_WINDOW_MINUTES)

    recent_successful_logins = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "successful_login",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    created_alerts = []
    updated_alerts = []

    for event in recent_successful_logins:

        if not event.username or not event.source_ip:
            continue

        previous_login = (
            db.query(SecurityEvent)
            .filter(
                SecurityEvent.event_type == "successful_login",
                SecurityEvent.asset_id == event.asset_id,
                SecurityEvent.username == event.username,
                SecurityEvent.source_ip == event.source_ip,
                SecurityEvent.timestamp < event.timestamp,
            )
            .first()
        )

        if previous_login:
            continue

        historical_login = (
            db.query(SecurityEvent)
            .filter(
                SecurityEvent.event_type == "successful_login",
                SecurityEvent.asset_id == event.asset_id,
                SecurityEvent.username == event.username,
                SecurityEvent.timestamp < event.timestamp,
                SecurityEvent.source_ip != event.source_ip,
            )
            .first()
        )

        # Ignore the user's first-ever successful login.
        if not historical_login:
            continue

        description = (
            f"User '{event.username}' successfully logged in from "
            f"new source IP {event.source_ip}. "
            f"A different source IP was previously observed "
            f"for this account."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=AUTH003_RULE_ID,
            title=AUTH003_TITLE,
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
# AUTH-004
# Multiple Accounts Targeted From One Source IP
# ============================================================

AUTH004_RULE_ID = "AUTH-004"
AUTH004_TITLE = "Multiple Accounts Targeted From One Source IP"

AUTH004_THRESHOLD = 4
AUTH004_WINDOW_MINUTES = 5


def detect_multiple_accounts_from_ip(db: Session):
    """
    Detect a source IP attempting to authenticate against
    multiple different user accounts.

    Trigger:
        4 or more distinct usernames targeted from the same
        source IP within 5 minutes.
    """

    now = get_current_utc_time()
    window_start = now - timedelta(minutes=AUTH004_WINDOW_MINUTES)

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "failed_login",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    grouped_events = {}

    for event in events:

        if not event.source_ip or not event.username:
            continue

        grouped_events.setdefault(
            event.source_ip,
            [],
        ).append(event)

    created_alerts = []
    updated_alerts = []

    for source_ip, source_events in grouped_events.items():

        usernames = sorted(
            {
                event.username
                for event in source_events
                if event.username
            }
        )

        event_count = len(source_events)

        if len(usernames) < AUTH004_THRESHOLD:
            continue

        asset_ids = {
            event.asset_id
            for event in source_events
            if event.asset_id
        }

        for asset_id in asset_ids:

            asset_event_count = sum(
                1
                for event in source_events
                if event.asset_id == asset_id
            )

            description = (
                f"Source IP {source_ip} targeted "
                f"{len(usernames)} different accounts "
                f"within {AUTH004_WINDOW_MINUTES} minutes. "
                f"Accounts targeted: {', '.join(usernames)}."
            )

            # AUTH-004 is source-IP focused, so username is left
            # empty rather than incorrectly assigning one account.
            existing_alert = (
                db.query(Alert)
                .filter(
                    Alert.rule_id == AUTH004_RULE_ID,
                    Alert.asset_id == asset_id,
                    Alert.source_ip == source_ip,
                    Alert.status.in_(ACTIVE_ALERT_STATUSES),
                )
                .first()
            )

            if existing_alert:

                existing_alert.event_count = asset_event_count
                existing_alert.description = description
                existing_alert.severity = "high"

                db.commit()
                db.refresh(existing_alert)

                updated_alerts.append(existing_alert)

            else:

                alert = Alert(
                    rule_id=AUTH004_RULE_ID,
                    title=AUTH004_TITLE,
                    description=description,
                    severity="high",
                    status="open",
                    asset_id=asset_id,
                    source_ip=source_ip,
                    username=None,
                    event_count=asset_event_count,
                )

                db.add(alert)
                db.commit()
                db.refresh(alert)

                created_alerts.append(alert)

    return created_alerts, updated_alerts


# ============================================================
# AUTH-005
# Privileged Account Login
# ============================================================

AUTH005_RULE_ID = "AUTH-005"
AUTH005_TITLE = "Privileged Account Login"


def detect_privileged_login(db: Session):
    """
    Detect successful authentication by a privileged account.

    The simulator/event source identifies privileged accounts
    through:

        raw_data["account_type"] == "privileged"

    Only successful logins are considered.
    """

    now = get_current_utc_time()
    window_start = now - timedelta(minutes=5)

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "successful_login",
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

        if raw_data.get("account_type") != "privileged":
            continue

        description = (
            f"Privileged account '{event.username}' successfully "
            f"logged in from source IP {event.source_ip}."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=AUTH005_RULE_ID,
            title=AUTH005_TITLE,
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
# AUTH-006
# Account Lockout Detection
# ============================================================

AUTH006_RULE_ID = "AUTH-006"
AUTH006_TITLE = "Account Lockout Detected"

AUTH006_WINDOW_MINUTES = 5


def detect_account_lockout(db: Session):
    """
    Detect account lockout events.

    Trigger:
        An account_lockout security event is observed
        within the last 5 minutes.

    Account lockouts can indicate:
        - repeated authentication failures
        - password spraying
        - brute-force activity
        - suspicious account targeting
    """

    now = get_current_utc_time()
    window_start = now - timedelta(minutes=AUTH006_WINDOW_MINUTES)

    events = (
        db.query(SecurityEvent)
        .filter(
            SecurityEvent.event_type == "account_lockout",
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp <= now,
        )
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    created_alerts = []
    updated_alerts = []

    for event in events:

        if not event.asset_id:
            continue

        description = (
            f"Account lockout detected for user '{event.username}' "
            f"from source IP {event.source_ip}."
        )

        created, updated = create_or_update_alert(
            db=db,
            rule_id=AUTH006_RULE_ID,
            title=AUTH006_TITLE,
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