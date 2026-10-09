import hashlib
import time
from datetime import datetime, timezone

import requests


# ============================================================
# AEGIS API CONFIGURATION
# ============================================================

BASE_URL = "http://127.0.0.1:8000"

ASSET_API_URL = f"{BASE_URL}/assets/auto-register"
EVENT_API_URL = f"{BASE_URL}/events/"


# ============================================================
# SIMULATED ENDPOINT
# ============================================================

HOSTNAME = "AEGIS-WIN-01"
IP_ADDRESS = "192.168.1.100"
OPERATING_SYSTEM = "Windows 11"


# ============================================================
# AUTHENTICATION SIMULATION
# ============================================================

PRIMARY_USERNAME = "admin"

KNOWN_SOURCE_IP = "192.168.1.50"
NEW_SOURCE_IP = "10.20.30.40"

PRIVILEGED_USERNAME = "admin"
PRIVILEGED_SOURCE_IP = "192.168.1.60"

TARGET_ACCOUNTS = [
    "admin",
    "alice",
    "bob",
    "charlie",
    "david",
]
# ============================================================
# AUTH-006
# ACCOUNT LOCKOUT
# ============================================================

ACCOUNT_LOCKOUT_USERNAME = "admin"

ACCOUNT_LOCKOUT_SOURCE_IP = "192.168.1.50"

ACCOUNT_LOCKOUT_REASON = "too_many_failed_attempts"

ACCOUNT_LOCKOUT_DURATION = "15_minutes"


# ============================================================
# NET-001
# PORT SCAN SIMULATION
# ============================================================

NETWORK_SOURCE_IP = "10.10.10.50"

NETWORK_DESTINATION_IP = "192.168.1.100"

SCAN_PORTS = [
    21,
    22,
    23,
    25,
    53,
    80,
    110,
    443,
    445,
    3389,
]


# ============================================================
# NET-002
# REPEATED CONNECTION SIMULATION
# ============================================================

REPEATED_CONNECTION_SOURCE_IP = "10.10.20.50"

REPEATED_CONNECTION_DESTINATION_IP = "192.168.1.100"

REPEATED_CONNECTION_PORT = 443

REPEATED_CONNECTION_COUNT = 12


# ============================================================
# NET-003
# UNUSUAL DESTINATION PORT
# ============================================================

UNUSUAL_PORT_SOURCE_IP = "10.10.30.50"

UNUSUAL_PORT_DESTINATION_IP = "192.168.1.100"

UNUSUAL_DESTINATION_PORT = 4444


# ============================================================
# NET-004
# HIGH VOLUME NETWORK CONNECTIONS
# ============================================================

HIGH_VOLUME_SOURCE_IP = "10.10.40.50"

HIGH_VOLUME_DESTINATION_IP = "192.168.1.100"

HIGH_VOLUME_DESTINATION_PORT = 443

HIGH_VOLUME_CONNECTION_COUNT = 50


# ============================================================
# NET-005
# UNKNOWN EXTERNAL DESTINATION
# ============================================================

EXTERNAL_DESTINATION_SOURCE_IP = "10.10.50.50"

EXTERNAL_DESTINATION_IP = "203.0.113.50"

EXTERNAL_DESTINATION_PORT = 443


# ============================================================
# PROC-001
# SUSPICIOUS POWERSHELL EXECUTION
# ============================================================

PROCESS_USERNAME = "admin"

PROCESS_SOURCE_IP = "192.168.1.100"

POWERSHELL_PROCESS = "powershell.exe"

SUSPICIOUS_POWERSHELL_COMMAND = (
    "powershell.exe "
    "-ExecutionPolicy Bypass "
    "-NoProfile "
    "-EncodedCommand "
    "SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQ"
)


# ============================================================
# PROC-002
# SUSPICIOUS COMMAND SHELL
# ============================================================

CMD_PROCESS = "cmd.exe"

SUSPICIOUS_CMD_COMMAND = (
    "cmd.exe /c whoami"
)


# ============================================================
# PROC-003
# LOLBIN ABUSE
# ============================================================

LOLBIN_PROCESS = "certutil.exe"

LOLBIN_COMMAND = (
    "certutil.exe -urlcache -split -f example"
)


# ============================================================
# PROC-004
# SUSPICIOUS PROCESS SPAWN
# ============================================================

SUSPICIOUS_PARENT_PROCESS = "winword.exe"

SUSPICIOUS_CHILD_PROCESS = "powershell.exe"

SUSPICIOUS_CHILD_COMMAND = (
    "powershell.exe -NoProfile"
)


# ============================================================
# PROC-005
# PERSISTENCE COMMAND
# ============================================================

PERSISTENCE_PROCESS = "schtasks.exe"

PERSISTENCE_COMMAND = (
    "schtasks.exe /create "
    "/tn AEGIS-Simulation "
    "/tr example.exe"
)


# ============================================================
# MAL-001
# SUSPICIOUS FILE CREATION
# ============================================================

MALWARE_FILE_NAME = "invoice_update.exe"

MALWARE_FILE_PATH = (
    r"C:\Users\admin\AppData\Local\Temp\invoice_update.exe"
)


# ============================================================
# MAL-002
# MALICIOUS HASH / IOC
# ============================================================

MALICIOUS_SIMULATION_HASH = (
    "aegis-sim-malware-sha256-001"
)


# ============================================================
# MAL-003
# SUSPICIOUS FILE EXECUTION
# ============================================================

MALWARE_EXECUTION_COMMAND = (
    r"C:\Users\admin\AppData\Local\Temp\invoice_update.exe"
)


# ============================================================
# MAL-004
# MALWARE PERSISTENCE
# ============================================================

MALWARE_PERSISTENCE_TYPE = "registry_run_key"

MALWARE_PERSISTENCE_LOCATION = (
    r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run"
)

MALWARE_PERSISTENCE_COMMAND = (
    r"C:\Users\admin\AppData\Local\Temp\invoice_update.exe"
)
# ============================================================
# PHISH-001
# SUSPICIOUS EMAIL LINK
# ============================================================

PHISH_USERNAME = "admin"

PHISH_SOURCE_IP = "192.168.1.100"

PHISH_SUSPICIOUS_URL = (
    "https://secure-login.example.invalid/verify-account"
)


# ============================================================
# PHISH-002
# MALICIOUS ATTACHMENT
# ============================================================

PHISH_ATTACHMENT_NAME = "invoice_payment.exe"


# ============================================================
# PHISH-003
# CREDENTIAL HARVESTING PAGE
# ============================================================

PHISH_CREDENTIAL_URL = (
    "https://account-verification.example.invalid/login"
)


# ============================================================
# PHISH-004
# SUSPICIOUS SENDER / DOMAIN
# ============================================================

PHISH_SENDER = "security-alert@example.invalid"

PHISH_SENDER_DOMAIN = "example.invalid"

PHISH_EMAIL_SUBJECT = (
    "Urgent account verification required"
)
# ============================================================
# WEB APPLICATION SCENARIOS
# ============================================================

WEB_SOURCE_IP = "10.50.10.25"

WEB_USERNAME = "admin"

WEB_APPLICATION = "AEGIS-Demo-WebApp"


# WEB-001
SQL_INJECTION_URL = (
    "/products?id=10"
)

SQL_INJECTION_QUERY = (
    "id=10 UNION SELECT username,password FROM users"
)


# WEB-002
XSS_URL = (
    "/search"
)

XSS_QUERY = (
    "q=<script>alert(document.cookie)</script>"
)


# WEB-003
DIRECTORY_TRAVERSAL_URL = (
    "/download"
)

DIRECTORY_TRAVERSAL_QUERY = (
    "file=../../../../etc/passwd"
)


# WEB-004
WEB_SCANNER_PATHS = [
    "/admin",
    "/login",
    "/robots.txt",
    "/backup",
    "/config",
    "/api",
    "/uploads",
    "/test",
    "/debug",
    "/phpinfo",
    "/server-status",
]
# ============================================================
# ASSET DISCOVERY
# ============================================================

def register_or_discover_asset() -> str:
    """
    Automatically register or discover the simulated endpoint.
    """

    payload = {
        "hostname": HOSTNAME,
        "ip_address": IP_ADDRESS,
        "operating_system": OPERATING_SYSTEM,
        "asset_type": "endpoint",
        "criticality": "high",
        "owner": "Security Operations",
    }

    print("\nDiscovering endpoint...")
    print(f"    Hostname: {HOSTNAME}")
    print(f"    IP Address: {IP_ADDRESS}")
    print(f"    OS: {OPERATING_SYSTEM}")

    try:
        response = requests.post(
            ASSET_API_URL,
            json=payload,
            timeout=10,
        )

        response.raise_for_status()

    except requests.RequestException as error:
        print("\nAsset registration failed.")
        print(f"    Error: {error}")
        raise

    asset = response.json()

    print("\nAsset registered/discovered successfully.")
    print(f"    Asset ID: {asset['id']}")
    print(f"    Hostname: {asset['hostname']}")
    print(f"    Status: {asset['status']}")

    return asset["id"]


# ============================================================
# SIMULATION RUN CONTEXT
# ============================================================

CURRENT_SIMULATION_RUN_ID: str | None = None


def set_simulation_run_id(run_id: str | None) -> None:
    """Set the active synthetic simulation-run identifier."""
    global CURRENT_SIMULATION_RUN_ID
    CURRENT_SIMULATION_RUN_ID = run_id


def _simulation_source_ip(
    source_ip: str | None,
    event_type: str,
) -> str | None:
    """
    Give non-authentication telemetry a run-specific synthetic source IP.

    This preserves the authentication scenarios' documented source addresses
    while allowing repeated non-auth scenarios to create distinct alert
    contexts without changing the detection engine's deduplication behavior.
    """
    if not source_ip or not CURRENT_SIMULATION_RUN_ID:
        return source_ip

    digest = hashlib.sha256(
        f"{CURRENT_SIMULATION_RUN_ID}:{source_ip}".encode("utf-8")
    ).digest()

    # Reserved private simulation range: 10.60.0.0/16.
    second_octet = 1 + (digest[0] % 254)
    third_octet = 1 + (digest[1] % 254)

    return f"10.60.{second_octet}.{third_octet}"


# ============================================================
# EVENT SUBMISSION
# ============================================================
# ============================================================
# SIMULATION RUN CONTEXT
# ============================================================

SIMULATION_RUN_ID: str | None = None


def set_simulation_run_id(run_id: str | None) -> None:
    """
    Set the identifier for the current controlled simulation run.

    This identifier is attached to synthetic telemetry so AEGIS can
    distinguish one simulation run from another without pretending
    the telemetry is production data.
    """
    global SIMULATION_RUN_ID, CURRENT_SIMULATION_RUN_ID
    SIMULATION_RUN_ID = run_id
    CURRENT_SIMULATION_RUN_ID = run_id
# ============================================================
# EVENT SUBMISSION
# ============================================================

def send_event(
    asset_id: str,
    username: str | None,
    event_type: str,
    severity: str,
    message: str,
    source_ip: str | None,
    raw_data: dict,
):
    """
    Send a simulated security event to the AEGIS API.

    Supports both authenticated events with a username
    and anonymous/system events where username is None.
    """

    effective_source_ip = _simulation_source_ip(
        source_ip=source_ip,
        event_type=event_type,
    )

    event_raw_data = dict(raw_data or {})

    if CURRENT_SIMULATION_RUN_ID:
        event_raw_data["simulation_run_id"] = CURRENT_SIMULATION_RUN_ID
        event_raw_data["simulation"] = True
        if effective_source_ip != source_ip:
            event_raw_data["simulation_source_ip"] = effective_source_ip

    payload = {
        "asset_id": asset_id,
        "timestamp": datetime.now(
            timezone.utc
        ).isoformat(),
        "source": "Windows",
        "event_type": event_type,
        "severity": severity,
        "message": message,
        "source_ip": effective_source_ip,
        "username": username,
        "raw_data": {
    **raw_data,
    "simulation": True,
    "simulation_run_id": SIMULATION_RUN_ID,
},
    }

    try:
        response = requests.post(
            EVENT_API_URL,
            json=payload,
            timeout=10,
        )

        # Safely display optional values
        username_display = (
            username
            if username is not None
            else "-"
        )

        source_ip_display = (
            effective_source_ip
            if effective_source_ip is not None
            else "-"
        )

        print(
            f"[{response.status_code}] "
            f"{event_type:<20} "
            f"user={username_display:<16} "
            f"ip={source_ip_display}"
        )

        if response.ok:
            event = response.json()

            print(
                f"    Event ID: {event['id']}"
            )

        else:
            print(
                f"    Error: {response.text}"
            )

    except requests.RequestException as error:
        print(
            f"    Event submission failed: {error}"
        )


# ============================================================
# AUTH-001
# MULTIPLE FAILED LOGINS
# ============================================================

def simulate_failed_logins(
    asset_id: str,
    count: int = 5,
):
    """
    Generate multiple failed login attempts
    for the primary account.
    """

    print(
        "\n[SCENARIO] AUTH-001 - Multiple Failed Logins"
    )

    print(
        f"    User: {PRIMARY_USERNAME}"
    )

    print(
        f"    Source IP: {KNOWN_SOURCE_IP}"
    )

    print(
        f"    Attempts: {count}"
    )

    for attempt in range(1, count + 1):

        send_event(
            asset_id=asset_id,
            username=PRIMARY_USERNAME,
            event_type="failed_login",
            severity="medium",
            message="Failed login attempt detected",
            source_ip=KNOWN_SOURCE_IP,
            raw_data={
                "attempt_number": attempt,
                "authentication_method": "password",
                "simulation": True,
            },
        )

        time.sleep(1)


# ============================================================
# AUTH-002
# SUCCESSFUL LOGIN AFTER REPEATED FAILURES
# ============================================================

def simulate_successful_login(
    asset_id: str,
):
    """
    Generate a successful login after repeated
    failed login attempts.
    """

    print(
        "\n[SCENARIO] AUTH-002 - "
        "Successful Login After Repeated Failures"
    )

    send_event(
        asset_id=asset_id,
        username=PRIMARY_USERNAME,
        event_type="successful_login",
        severity="low",
        message=(
            "Successful login detected after "
            "multiple failed attempts"
        ),
        source_ip=KNOWN_SOURCE_IP,
        raw_data={
            "authentication_method": "password",
            "login_result": "success",
            "simulation": True,
        },
    )


# ============================================================
# AUTH-003
# LOGIN FROM NEW SOURCE IP
# ============================================================

def simulate_new_source_ip_login(
    asset_id: str,
):
    """
    Generate a successful login from a previously
    unseen source IP.
    """

    print(
        "\n[SCENARIO] AUTH-003 - "
        "Login From New Source IP"
    )

    print(
        f"    Known IP: {KNOWN_SOURCE_IP}"
    )

    print(
        f"    New IP:   {NEW_SOURCE_IP}"
    )

    send_event(
        asset_id=asset_id,
        username=PRIMARY_USERNAME,
        event_type="successful_login",
        severity="medium",
        message=(
            "Successful login detected from "
            "previously unseen source IP"
        ),
        source_ip=NEW_SOURCE_IP,
        raw_data={
            "authentication_method": "password",
            "login_result": "success",
            "source_ip_change": True,
            "simulation": True,
        },
    )


# ============================================================
# AUTH-004
# MULTIPLE ACCOUNTS TARGETED FROM ONE IP
# ============================================================

def simulate_password_spraying(
    asset_id: str,
):
    """
    Simulate password-spraying activity.

    One source IP attempts authentication
    against multiple user accounts.
    """

    print(
        "\n[SCENARIO] AUTH-004 - Password Spraying"
    )

    print(
        f"    Source IP: {KNOWN_SOURCE_IP}"
    )

    print(
        f"    Target accounts: "
        f"{', '.join(TARGET_ACCOUNTS)}"
    )

    for username in TARGET_ACCOUNTS:

        send_event(
            asset_id=asset_id,
            username=username,
            event_type="failed_login",
            severity="medium",
            message=(
                "Failed login attempt detected "
                "during authentication activity"
            ),
            source_ip=KNOWN_SOURCE_IP,
            raw_data={
                "attack_pattern": "password_spraying",
                "authentication_method": "password",
                "simulation": True,
            },
        )

        time.sleep(1)


# ============================================================
# AUTH-005
# PRIVILEGED ACCOUNT LOGIN
# ============================================================

def simulate_privileged_login(
    asset_id: str,
):
    """
    Simulate a successful login by a privileged account.
    """

    print(
        "\n[SCENARIO] AUTH-005 - "
        "Privileged Account Login"
    )

    print(
        f"    User: {PRIVILEGED_USERNAME}"
    )

    print(
        f"    Source IP: {PRIVILEGED_SOURCE_IP}"
    )

    send_event(
        asset_id=asset_id,
        username=PRIVILEGED_USERNAME,
        event_type="successful_login",
        severity="high",
        message=(
            "Privileged account login detected"
        ),
        source_ip=PRIVILEGED_SOURCE_IP,
        raw_data={
            "authentication_method": "password",
            "login_result": "success",
            "account_type": "privileged",
            "simulation": True,
        },
    )
 # ============================================================
# AUTH-006
# ACCOUNT LOCKOUT
# ============================================================

def simulate_account_lockout(
    asset_id: str,
):
    """
    Simulate an account lockout event.

    This function only sends security telemetry.
    It does NOT actually lock the Windows account.
    """

    print(
        "\n[SCENARIO] AUTH-006 - "
        "Account Lockout"
    )

    print(
        f"    User: {ACCOUNT_LOCKOUT_USERNAME}"
    )

    print(
        f"    Source IP: {ACCOUNT_LOCKOUT_SOURCE_IP}"
    )

    print(
        f"    Reason: {ACCOUNT_LOCKOUT_REASON}"
    )

    print(
        f"    Duration: {ACCOUNT_LOCKOUT_DURATION}"
    )

    send_event(
        asset_id=asset_id,
        username=ACCOUNT_LOCKOUT_USERNAME,
        event_type="account_lockout",
        severity="high",
        message=(
            "User account locked after repeated "
            "authentication failures"
        ),
        source_ip=ACCOUNT_LOCKOUT_SOURCE_IP,
        raw_data={
            "account_type": "standard",
            "lockout_reason": ACCOUNT_LOCKOUT_REASON,
            "lockout_duration": ACCOUNT_LOCKOUT_DURATION,
            "authentication_method": "password",
            "simulation": True,
        },
    )


# ============================================================
# NET-001
# PORT SCAN
# ============================================================

def simulate_port_scan(
    asset_id: str,
):
    """
    Simulate a port scan against the endpoint.
    """

    print(
        "\n[SCENARIO] NET-001 - Port Scan"
    )

    print(
        f"    Source IP: {NETWORK_SOURCE_IP}"
    )

    print(
        f"    Target IP: {NETWORK_DESTINATION_IP}"
    )

    print(
        f"    Ports scanned: {len(SCAN_PORTS)}"
    )

    for port in SCAN_PORTS:

        send_event(
            asset_id=asset_id,
            username="network-scanner",
            event_type="network_connection",
            severity="medium",
            message=(
                f"Network connection attempt "
                f"to destination port {port}"
            ),
            source_ip=NETWORK_SOURCE_IP,
            raw_data={
                "destination_ip": NETWORK_DESTINATION_IP,
                "destination_port": port,
                "protocol": "TCP",
                "connection_result": "connection_attempt",
                "simulation": True,
            },
        )

        time.sleep(0.5)


# ============================================================
# NET-002
# REPEATED CONNECTION ATTEMPTS
# ============================================================

def simulate_repeated_connections(
    asset_id: str,
):
    """
    Simulate repeated connections from one source
    to the same destination and port.
    """

    print(
        "\n[SCENARIO] NET-002 - "
        "Repeated Connection Attempts"
    )

    print(
        f"    Source IP: {REPEATED_CONNECTION_SOURCE_IP}"
    )

    print(
        f"    Destination: "
        f"{REPEATED_CONNECTION_DESTINATION_IP}:"
        f"{REPEATED_CONNECTION_PORT}"
    )

    print(
        f"    Attempts: {REPEATED_CONNECTION_COUNT}"
    )

    for attempt in range(
        1,
        REPEATED_CONNECTION_COUNT + 1,
    ):

        send_event(
            asset_id=asset_id,
            username="network-client",
            event_type="network_connection",
            severity="medium",
            message=(
                "Repeated network connection attempt"
            ),
            source_ip=REPEATED_CONNECTION_SOURCE_IP,
            raw_data={
                "destination_ip":
                    REPEATED_CONNECTION_DESTINATION_IP,
                "destination_port":
                    REPEATED_CONNECTION_PORT,
                "protocol": "TCP",
                "attempt_number": attempt,
                "connection_result":
                    "connection_attempt",
                "simulation": True,
            },
        )

        time.sleep(0.3)


# ============================================================
# NET-003
# UNUSUAL DESTINATION PORT
# ============================================================

def simulate_unusual_destination_port(
    asset_id: str,
):
    """
    Simulate a connection to an unusual destination port.
    """

    print(
        "\n[SCENARIO] NET-003 - "
        "Unusual Destination Port"
    )

    print(
        f"    Source IP: {UNUSUAL_PORT_SOURCE_IP}"
    )

    print(
        f"    Destination: "
        f"{UNUSUAL_PORT_DESTINATION_IP}:"
        f"{UNUSUAL_DESTINATION_PORT}"
    )

    send_event(
        asset_id=asset_id,
        username="network-client",
        event_type="network_connection",
        severity="high",
        message=(
            "Connection attempt to unusual "
            "destination port"
        ),
        source_ip=UNUSUAL_PORT_SOURCE_IP,
        raw_data={
            "destination_ip":
                UNUSUAL_PORT_DESTINATION_IP,
            "destination_port":
                UNUSUAL_DESTINATION_PORT,
            "protocol": "TCP",
            "connection_result":
                "connection_attempt",
            "port_classification":
                "unusual",
            "simulation": True,
        },
    )


# ============================================================
# NET-004
# HIGH VOLUME NETWORK CONNECTIONS
# ============================================================

def simulate_high_volume_connections(
    asset_id: str,
):
    """
    Simulate a high volume of network connections
    from one source IP.
    """

    print(
        "\n[SCENARIO] NET-004 - "
        "High Volume Network Connections"
    )

    print(
        f"    Source IP: {HIGH_VOLUME_SOURCE_IP}"
    )

    print(
        f"    Destination: "
        f"{HIGH_VOLUME_DESTINATION_IP}:"
        f"{HIGH_VOLUME_DESTINATION_PORT}"
    )

    print(
        f"    Connections: "
        f"{HIGH_VOLUME_CONNECTION_COUNT}"
    )

    for attempt in range(
        1,
        HIGH_VOLUME_CONNECTION_COUNT + 1,
    ):

        send_event(
            asset_id=asset_id,
            username="network-client",
            event_type="network_connection",
            severity="medium",
            message=(
                "High volume network "
                "connection detected"
            ),
            source_ip=HIGH_VOLUME_SOURCE_IP,
            raw_data={
                "destination_ip":
                    HIGH_VOLUME_DESTINATION_IP,
                "destination_port":
                    HIGH_VOLUME_DESTINATION_PORT,
                "protocol": "TCP",
                "attempt_number": attempt,
                "connection_result":
                    "connection_attempt",
                "simulation": True,
            },
        )

        time.sleep(0.05)


# ============================================================
# NET-005
# UNKNOWN EXTERNAL DESTINATION
# ============================================================

def simulate_unknown_external_destination(
    asset_id: str,
):
    """
    Simulate a connection to an unknown external destination.
    """

    print(
        "\n[SCENARIO] NET-005 - "
        "Unknown External Destination"
    )

    print(
        f"    Source IP: "
        f"{EXTERNAL_DESTINATION_SOURCE_IP}"
    )

    print(
        f"    External Destination: "
        f"{EXTERNAL_DESTINATION_IP}:"
        f"{EXTERNAL_DESTINATION_PORT}"
    )

    send_event(
        asset_id=asset_id,
        username="network-client",
        event_type="network_connection",
        severity="medium",
        message=(
            "Connection attempt to unknown "
            "external destination"
        ),
        source_ip=EXTERNAL_DESTINATION_SOURCE_IP,
        raw_data={
            "destination_ip":
                EXTERNAL_DESTINATION_IP,
            "destination_port":
                EXTERNAL_DESTINATION_PORT,
            "protocol": "TCP",
            "destination_external": True,
            "known_destination": False,
            "connection_result":
                "connection_attempt",
            "simulation": True,
        },
    )


# ============================================================
# PROC-001
# SUSPICIOUS POWERSHELL EXECUTION
# ============================================================

def simulate_suspicious_powershell(
    asset_id: str,
):
    """
    Simulate suspicious PowerShell telemetry.

    This function does NOT execute PowerShell.
    It only sends process telemetry to AEGIS.
    """

    print(
        "\n[SCENARIO] PROC-001 - "
        "Suspicious PowerShell Execution"
    )

    print(
        f"    User: {PROCESS_USERNAME}"
    )

    print(
        f"    Process: {POWERSHELL_PROCESS}"
    )

    print("    Indicators:")
    print("        - ExecutionPolicy Bypass")
    print("        - NoProfile")
    print("        - EncodedCommand")

    send_event(
        asset_id=asset_id,
        username=PROCESS_USERNAME,
        event_type="process_creation",
        severity="high",
        message=(
            "Suspicious PowerShell execution detected"
        ),
        source_ip=PROCESS_SOURCE_IP,
        raw_data={
            "process_name":
                POWERSHELL_PROCESS,
            "command_line":
                SUSPICIOUS_POWERSHELL_COMMAND,
            "parent_process":
                "explorer.exe",
            "process_id":
                4820,
            "execution_policy":
                "Bypass",
            "encoded_command":
                True,
            "simulation":
                True,
        },
    )


# ============================================================
# PROC-002
# SUSPICIOUS COMMAND SHELL
# ============================================================

def simulate_suspicious_cmd(
    asset_id: str,
):
    """
    Simulate suspicious cmd.exe telemetry.
    """

    print(
        "\n[SCENARIO] PROC-002 - "
        "Suspicious Command Shell"
    )

    print(
        f"    User: {PROCESS_USERNAME}"
    )

    print(
        f"    Process: {CMD_PROCESS}"
    )

    print(
        f"    Command: {SUSPICIOUS_CMD_COMMAND}"
    )

    send_event(
        asset_id=asset_id,
        username=PROCESS_USERNAME,
        event_type="process_creation",
        severity="medium",
        message=(
            "Suspicious command shell activity detected"
        ),
        source_ip=PROCESS_SOURCE_IP,
        raw_data={
            "process_name":
                CMD_PROCESS,
            "command_line":
                SUSPICIOUS_CMD_COMMAND,
            "parent_process":
                "explorer.exe",
            "process_id":
                5100,
            "simulation":
                True,
        },
    )


# ============================================================
# PROC-003
# LOLBIN ABUSE
# ============================================================

def simulate_lolbin_abuse(
    asset_id: str,
):
    """
    Simulate telemetry involving a Windows LOLBin.
    """

    print(
        "\n[SCENARIO] PROC-003 - "
        "LOLBin Abuse"
    )

    print(
        f"    User: {PROCESS_USERNAME}"
    )

    print(
        f"    Process: {LOLBIN_PROCESS}"
    )

    print(
        f"    Command: {LOLBIN_COMMAND}"
    )

    send_event(
        asset_id=asset_id,
        username=PROCESS_USERNAME,
        event_type="process_creation",
        severity="high",
        message=(
            "Potential LOLBin execution detected"
        ),
        source_ip=PROCESS_SOURCE_IP,
        raw_data={
            "process_name":
                LOLBIN_PROCESS,
            "command_line":
                LOLBIN_COMMAND,
            "parent_process":
                "cmd.exe",
            "process_id":
                5200,
            "simulation":
                True,
        },
    )


# ============================================================
# PROC-004
# SUSPICIOUS PROCESS SPAWN
# ============================================================

def simulate_suspicious_process_spawn(
    asset_id: str,
):
    """
    Simulate a suspicious parent-child process relationship.
    """

    print(
        "\n[SCENARIO] PROC-004 - "
        "Suspicious Process Spawn"
    )

    print(
        f"    Parent: {SUSPICIOUS_PARENT_PROCESS}"
    )

    print(
        f"    Child: {SUSPICIOUS_CHILD_PROCESS}"
    )

    send_event(
        asset_id=asset_id,
        username=PROCESS_USERNAME,
        event_type="process_creation",
        severity="high",
        message=(
            "Suspicious parent-child process "
            "relationship detected"
        ),
        source_ip=PROCESS_SOURCE_IP,
        raw_data={
            "process_name":
                SUSPICIOUS_CHILD_PROCESS,
            "command_line":
                SUSPICIOUS_CHILD_COMMAND,
            "parent_process":
                SUSPICIOUS_PARENT_PROCESS,
            "process_id":
                5300,
            "parent_process_id":
                4200,
            "simulation":
                True,
        },
    )


# ============================================================
# PROC-005
# PERSISTENCE COMMAND
# ============================================================

def simulate_persistence_command(
    asset_id: str,
):
    """
    Simulate telemetry associated with a
    potential persistence mechanism.
    """

    print(
        "\n[SCENARIO] PROC-005 - "
        "Persistence Command"
    )

    print(
        f"    User: {PROCESS_USERNAME}"
    )

    print(
        f"    Process: {PERSISTENCE_PROCESS}"
    )

    print(
        f"    Command: {PERSISTENCE_COMMAND}"
    )

    send_event(
        asset_id=asset_id,
        username=PROCESS_USERNAME,
        event_type="process_creation",
        severity="high",
        message=(
            "Potential persistence command detected"
        ),
        source_ip=PROCESS_SOURCE_IP,
        raw_data={
            "process_name":
                PERSISTENCE_PROCESS,
            "command_line":
                PERSISTENCE_COMMAND,
            "parent_process":
                "cmd.exe",
            "process_id":
                5400,
            "simulation":
                True,
        },
    )


# ============================================================
# MAL-001
# SUSPICIOUS FILE CREATION
# ============================================================

def simulate_suspicious_file_creation(
    asset_id: str,
):
    """
    Simulate creation of a suspicious executable.

    This function only sends telemetry.
    It does NOT create a real file.
    """

    print(
        "\n[SCENARIO] MAL-001 - "
        "Suspicious File Creation"
    )

    print(
        f"    File: {MALWARE_FILE_NAME}"
    )

    print(
        f"    Path: {MALWARE_FILE_PATH}"
    )

    send_event(
        asset_id=asset_id,
        username=PROCESS_USERNAME,
        event_type="file_creation",
        severity="high",
        message=(
            "Suspicious executable file created "
            "in temporary directory"
        ),
        source_ip=PROCESS_SOURCE_IP,
        raw_data={
            "simulation": True,
            "file_name": MALWARE_FILE_NAME,
            "file_path": MALWARE_FILE_PATH,
            "file_extension": ".exe",
            "file_size": 184320,
        },
    )


# ============================================================
# MAL-002
# MALICIOUS HASH / IOC MATCH
# ============================================================

def simulate_malicious_hash(
    asset_id: str,
):
    """
    Simulate a file hash matching a known malicious IOC.

    The IOC is a fake AEGIS simulation value.
    No real malware is involved.
    """

    print(
        "\n[SCENARIO] MAL-002 - "
        "Malicious Hash / IOC Match"
    )

    print(
        f"    File: {MALWARE_FILE_NAME}"
    )

    print(
        f"    SHA-256: {MALICIOUS_SIMULATION_HASH}"
    )

    send_event(
        asset_id=asset_id,
        username=PROCESS_USERNAME,
        event_type="file_hash",
        severity="critical",
        message=(
            "File hash matched known malicious IOC"
        ),
        source_ip=PROCESS_SOURCE_IP,
        raw_data={
            "simulation": True,
            "file_name": MALWARE_FILE_NAME,
            "file_path": MALWARE_FILE_PATH,
            "sha256": MALICIOUS_SIMULATION_HASH,
            "ioc_type": "sha256",
            "ioc_source": "AEGIS-Simulation-IOC",
        },
    )


# ============================================================
# MAL-003
# SUSPICIOUS FILE EXECUTION
# ============================================================

def simulate_suspicious_file_execution(
    asset_id: str,
):
    """
    Simulate execution of a suspicious executable.

    This function only sends telemetry.
    It does NOT execute the file.
    """

    print(
        "\n[SCENARIO] MAL-003 - "
        "Suspicious File Execution"
    )

    print(
        f"    File: {MALWARE_FILE_NAME}"
    )

    print(
        f"    Path: {MALWARE_FILE_PATH}"
    )

    send_event(
        asset_id=asset_id,
        username=PROCESS_USERNAME,
        event_type="file_execution",
        severity="high",
        message=(
            "Suspicious executable launched "
            "from temporary directory"
        ),
        source_ip=PROCESS_SOURCE_IP,
        raw_data={
            "simulation": True,
            "file_name": MALWARE_FILE_NAME,
            "file_path": MALWARE_FILE_PATH,
            "command_line":
                MALWARE_EXECUTION_COMMAND,
            "parent_process":
                "explorer.exe",
            "execution_source":
                "temporary_directory",
        },
    )


# ============================================================
# MAL-004
# MALWARE PERSISTENCE
# ============================================================

def simulate_malware_persistence(
    asset_id: str,
):
    """
    Simulate a suspicious malware persistence mechanism.

    This function only sends telemetry.
    It does NOT modify the Windows registry.
    """

    print(
        "\n[SCENARIO] MAL-004 - "
        "Malware Persistence"
    )

    print(
        f"    Persistence Type: "
        f"{MALWARE_PERSISTENCE_TYPE}"
    )

    print(
        f"    Location: "
        f"{MALWARE_PERSISTENCE_LOCATION}"
    )

    send_event(
        asset_id=asset_id,
        username=PROCESS_USERNAME,
        event_type="persistence",
        severity="critical",
        message=(
            "Potential malware persistence "
            "mechanism detected"
        ),
        source_ip=PROCESS_SOURCE_IP,
        raw_data={
            "simulation": True,
            "persistence_type":
                MALWARE_PERSISTENCE_TYPE,
            "location":
                MALWARE_PERSISTENCE_LOCATION,
            "command_line":
                MALWARE_PERSISTENCE_COMMAND,
            "persistence_mechanism":
                "registry_run_key",
        },
    )

# ============================================================
# PHISH-001
# SUSPICIOUS EMAIL LINK
# ============================================================

def simulate_suspicious_email_link(
    asset_id: str,
):
    """
    Simulate an email containing a suspicious link.

    This function only sends telemetry.
    It does NOT send a real email or open the URL.
    """

    print(
        "\n[SCENARIO] PHISH-001 - "
        "Suspicious Email Link"
    )

    print(
        f"    User: {PHISH_USERNAME}"
    )

    print(
        f"    URL: {PHISH_SUSPICIOUS_URL}"
    )

    send_event(
        asset_id=asset_id,
        username=PHISH_USERNAME,
        event_type="email_link",
        severity="high",
        message=(
            "Suspicious email link detected"
        ),
        source_ip=PHISH_SOURCE_IP,
        raw_data={
            "simulation": True,
            "url": PHISH_SUSPICIOUS_URL,
            "link_text": "Verify your account",
            "email_source": "simulated_mailbox",
        },
    )


# ============================================================
# PHISH-002
# MALICIOUS ATTACHMENT
# ============================================================

def simulate_malicious_attachment(
    asset_id: str,
):
    """
    Simulate an email containing a suspicious attachment.

    This function only sends telemetry.
    It does NOT create or execute the attachment.
    """

    print(
        "\n[SCENARIO] PHISH-002 - "
        "Malicious Attachment"
    )

    print(
        f"    Attachment: {PHISH_ATTACHMENT_NAME}"
    )

    send_event(
        asset_id=asset_id,
        username=PHISH_USERNAME,
        event_type="email_attachment",
        severity="high",
        message=(
            "Suspicious executable attachment "
            "received by user"
        ),
        source_ip=PHISH_SOURCE_IP,
        raw_data={
            "simulation": True,
            "file_name": PHISH_ATTACHMENT_NAME,
            "file_type": "Windows executable",
            "email_source": "simulated_mailbox",
        },
    )


# ============================================================
# PHISH-003
# CREDENTIAL HARVESTING PAGE
# ============================================================

def simulate_credential_harvesting_page(
    asset_id: str,
):
    """
    Simulate browser telemetry for a credential harvesting page.

    This function only sends telemetry.
    It does NOT open the URL.
    """

    print(
        "\n[SCENARIO] PHISH-003 - "
        "Credential Harvesting Page"
    )

    print(
        f"    URL: {PHISH_CREDENTIAL_URL}"
    )

    send_event(
        asset_id=asset_id,
        username=PHISH_USERNAME,
        event_type="web_navigation",
        severity="critical",
        message=(
            "Potential credential harvesting page visited"
        ),
        source_ip=PHISH_SOURCE_IP,
        raw_data={
            "simulation": True,
            "url": PHISH_CREDENTIAL_URL,
            "page_title": "Secure Account Login",
            "page_classification": "credential_harvesting",
            "browser": "Microsoft Edge",
        },
    )


# ============================================================
# PHISH-004
# SUSPICIOUS SENDER / DOMAIN
# ============================================================

def simulate_suspicious_sender_domain(
    asset_id: str,
):
    """
    Simulate receipt of an email from a suspicious sender/domain.

    This function only sends telemetry.
    It does NOT send a real email.
    """

    print(
        "\n[SCENARIO] PHISH-004 - "
        "Suspicious Sender / Domain"
    )

    print(
        f"    Sender: {PHISH_SENDER}"
    )

    print(
        f"    Domain: {PHISH_SENDER_DOMAIN}"
    )

    send_event(
        asset_id=asset_id,
        username=PHISH_USERNAME,
        event_type="email_received",
        severity="medium",
        message=(
            "Email received from suspicious sender/domain"
        ),
        source_ip=PHISH_SOURCE_IP,
        raw_data={
            "simulation": True,
            "sender": PHISH_SENDER,
            "sender_domain": PHISH_SENDER_DOMAIN,
            "subject": PHISH_EMAIL_SUBJECT,
            "email_source": "simulated_mailbox",
        },
    )
    # ============================================================
# WEB-001
# SQL INJECTION
# ============================================================

def simulate_sql_injection(
    asset_id: str,
):
    """
    Simulate SQL injection telemetry.

    No real SQL query is executed.
    """

    print(
        "\n[SCENARIO] WEB-001 - "
        "SQL Injection Attempt"
    )

    print(
        f"    Source IP: {WEB_SOURCE_IP}"
    )

    print(
        f"    URL: {SQL_INJECTION_URL}"
    )

    send_event(
        asset_id=asset_id,
        username=WEB_USERNAME,
        event_type="web_request",
        severity="high",
        message="Potential SQL injection request detected",
        source_ip=WEB_SOURCE_IP,
        raw_data={
            "simulation": True,
            "application": WEB_APPLICATION,
            "method": "GET",
            "url": SQL_INJECTION_URL,
            "query_string": SQL_INJECTION_QUERY,
            "request_body": "",
            "http_status": 400,
        },
    )


# ============================================================
# WEB-002
# CROSS-SITE SCRIPTING
# ============================================================

def simulate_xss_attempt(
    asset_id: str,
):
    """
    Simulate XSS telemetry.

    No browser payload is executed.
    """

    print(
        "\n[SCENARIO] WEB-002 - "
        "Cross-Site Scripting Attempt"
    )

    print(
        f"    Source IP: {WEB_SOURCE_IP}"
    )

    print(
        f"    URL: {XSS_URL}"
    )

    send_event(
        asset_id=asset_id,
        username=WEB_USERNAME,
        event_type="web_request",
        severity="high",
        message="Potential XSS request detected",
        source_ip=WEB_SOURCE_IP,
        raw_data={
            "simulation": True,
            "application": WEB_APPLICATION,
            "method": "GET",
            "url": XSS_URL,
            "query_string": XSS_QUERY,
            "request_body": "",
            "http_status": 400,
        },
    )


# ============================================================
# WEB-003
# DIRECTORY TRAVERSAL
# ============================================================

def simulate_directory_traversal(
    asset_id: str,
):
    """
    Simulate directory traversal telemetry.

    No file is accessed.
    """

    print(
        "\n[SCENARIO] WEB-003 - "
        "Directory Traversal"
    )

    print(
        f"    Source IP: {WEB_SOURCE_IP}"
    )

    print(
        f"    URL: {DIRECTORY_TRAVERSAL_URL}"
    )

    send_event(
        asset_id=asset_id,
        username=WEB_USERNAME,
        event_type="web_request",
        severity="high",
        message="Potential directory traversal request detected",
        source_ip=WEB_SOURCE_IP,
        raw_data={
            "simulation": True,
            "application": WEB_APPLICATION,
            "method": "GET",
            "url": DIRECTORY_TRAVERSAL_URL,
            "query_string": DIRECTORY_TRAVERSAL_QUERY,
            "request_body": "",
            "http_status": 403,
        },
    )


# ============================================================
# WEB-004
# WEB SCANNER / ENUMERATION
# ============================================================

def simulate_web_scanner(
    asset_id: str,
):
    """
    Simulate web enumeration activity.

    No real scanning is performed.
    """

    print(
        "\n[SCENARIO] WEB-004 - "
        "Web Scanner / Enumeration"
    )

    print(
        f"    Source IP: {WEB_SOURCE_IP}"
    )

    print(
        f"    Requests: {len(WEB_SCANNER_PATHS)}"
    )

    for path in WEB_SCANNER_PATHS:

        send_event(
            asset_id=asset_id,
            username=None,
            event_type="web_request",
            severity="medium",
            message="Simulated web enumeration request",
            source_ip=WEB_SOURCE_IP,
            raw_data={
                "simulation": True,
                "application": WEB_APPLICATION,
                "method": "GET",
                "url": path,
                "query_string": "",
                "request_body": "",
                "http_status": 404,
            },
        )

        time.sleep(0.1)
# ============================================================
# MAIN SIMULATION
# ============================================================

def main():

    print("=" * 60)
    print("AEGIS Security Event Simulator")
    print("=" * 60)

    print("\nTarget API:")
    print(BASE_URL)

    print("\nStarting simulation...")

    # --------------------------------------------------------
    # Asset Discovery
    # --------------------------------------------------------

    asset_id = register_or_discover_asset()

    # --------------------------------------------------------
    # AUTH-001
    # --------------------------------------------------------

    simulate_failed_logins(
        asset_id=asset_id,
        count=5,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # AUTH-002
    # --------------------------------------------------------

    simulate_successful_login(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # AUTH-003
    # --------------------------------------------------------

    simulate_new_source_ip_login(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # AUTH-004
    # --------------------------------------------------------

    simulate_password_spraying(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # AUTH-005
    # --------------------------------------------------------

    simulate_privileged_login(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # AUTH-006
    # --------------------------------------------------------
    simulate_account_lockout(
        asset_id=asset_id,
    )
    
    time.sleep(2)
    # --------------------------------------------------------
    # NET-001
    # --------------------------------------------------------

    simulate_port_scan(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # NET-002
    # --------------------------------------------------------

    simulate_repeated_connections(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # NET-003
    # --------------------------------------------------------

    simulate_unusual_destination_port(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # NET-004
    # --------------------------------------------------------

    simulate_high_volume_connections(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # NET-005
    # --------------------------------------------------------

    simulate_unknown_external_destination(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # PROC-001
    # --------------------------------------------------------

    simulate_suspicious_powershell(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # PROC-002
    # --------------------------------------------------------

    simulate_suspicious_cmd(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # PROC-003
    # --------------------------------------------------------

    simulate_lolbin_abuse(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # PROC-004
    # --------------------------------------------------------

    simulate_suspicious_process_spawn(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # PROC-005
    # --------------------------------------------------------

    simulate_persistence_command(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # MAL-001
    # --------------------------------------------------------

    simulate_suspicious_file_creation(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # MAL-002
    # --------------------------------------------------------

    simulate_malicious_hash(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # MAL-003
    # --------------------------------------------------------

    simulate_suspicious_file_execution(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # MAL-004
    # --------------------------------------------------------

    simulate_malware_persistence(
        asset_id=asset_id,
    )

    time.sleep(2)

    # --------------------------------------------------------
    # PHISH-001
    # --------------------------------------------------------
    simulate_suspicious_email_link(
        asset_id=asset_id,
    )

    time.sleep(2)
    # --------------------------------------------------------
    # PHISH-002
    # --------------------------------------------------------
    simulate_malicious_attachment(
        asset_id=asset_id,
    )
    
    time.sleep(2)
    # --------------------------------------------------------
    # PHISH-003
    # --------------------------------------------------------
    simulate_credential_harvesting_page(
        asset_id=asset_id,
    )
    
    time.sleep(2)
    
    # --------------------------------------------------------
    # PHISH-004
    # --------------------------------------------------------
    simulate_suspicious_sender_domain(
        asset_id=asset_id,
    )
    
    time.sleep(2)

    # --------------------------------------------------------
    # WEB-001
    # --------------------------------------------------------
    simulate_sql_injection(
        asset_id=asset_id,
        )
    
    time.sleep(2)
    # --------------------------------------------------------
    # WEB-002
    # --------------------------------------------------------
    simulate_xss_attempt(
        asset_id=asset_id,
    )
    
    time.sleep(2)
    # --------------------------------------------------------
    # WEB-003
    # --------------------------------------------------------
    simulate_directory_traversal(
        asset_id=asset_id,
    )
    
    time.sleep(2)
    # --------------------------------------------------------
    # WEB-004
    # --------------------------------------------------------
    simulate_web_scanner(
        asset_id=asset_id,
    )
    
    time.sleep(2)

    # --------------------------------------------------------
    # Simulation Complete
    # --------------------------------------------------------

    print("\n" + "=" * 60)
    print("Simulation completed.")
    print("=" * 60)


# ============================================================
# PROGRAM ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()