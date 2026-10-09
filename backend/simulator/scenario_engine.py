"""
AEGIS Security Simulation Engine
--------------------------------

Intentional synthetic telemetry layer for the AEGIS SOC-GRC platform.

This module builds reusable SOC scenarios on top of the existing
security_event_simulator.py functions. It does NOT execute attacks,
PowerShell, SQL, malware, network scans, or phishing activity.

Workflow:
    Scenario -> Synthetic Events -> Detection -> Alert/Incident -> GRC

Run from backend/:

    python simulator/scenario_engine.py --list
    python simulator/scenario_engine.py --scenario AUTH-BRUTE-FORCE
    python simulator/scenario_engine.py --scenario WEB-SQL-INJECTION
    python simulator/scenario_engine.py --scenario ALL

The existing security_event_simulator.py remains unchanged and can
still be used independently.
"""
from __future__ import annotations
from datetime import datetime, timezone
import uuid
import argparse
import ipaddress
import sys
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

# Make the backend directory importable when this file is executed as:
#     python simulator\scenario_engine.py ...
# The script lives in backend/simulator/, while the app package lives in
# backend/app/.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import requests

from app.database import SessionLocal
from app.models.security_event import SecurityEvent

try:
    from simulator.security_event_simulator import (
    BASE_URL,
    PRIMARY_USERNAME,
    KNOWN_SOURCE_IP,
    send_event,
    register_or_discover_asset,
    simulate_failed_logins,
    simulate_successful_login,
    simulate_new_source_ip_login,
    simulate_password_spraying,
    simulate_privileged_login,
    simulate_account_lockout,
    simulate_port_scan,
    simulate_repeated_connections,
    simulate_unusual_destination_port,
    simulate_high_volume_connections,
    simulate_unknown_external_destination,
    simulate_suspicious_powershell,
    simulate_suspicious_cmd,
    simulate_lolbin_abuse,
    simulate_suspicious_process_spawn,
    simulate_persistence_command,
    simulate_suspicious_file_creation,
    simulate_malicious_hash,
    simulate_suspicious_file_execution,
    simulate_malware_persistence,
    simulate_suspicious_email_link,
    simulate_malicious_attachment,
    simulate_credential_harvesting_page,
    simulate_suspicious_sender_domain,
    simulate_sql_injection,
    simulate_xss_attempt,
    simulate_directory_traversal,
    simulate_web_scanner,
    set_simulation_run_id,
)
except ModuleNotFoundError:
    from security_event_simulator import (
        BASE_URL,
        PRIMARY_USERNAME,
        KNOWN_SOURCE_IP,
        send_event,
        register_or_discover_asset,
        simulate_failed_logins,
        simulate_successful_login,
        simulate_new_source_ip_login,
        simulate_password_spraying,
        simulate_privileged_login,
        simulate_account_lockout,
        simulate_port_scan,
        simulate_repeated_connections,
        simulate_unusual_destination_port,
        simulate_high_volume_connections,
        simulate_unknown_external_destination,
        simulate_suspicious_powershell,
        simulate_suspicious_cmd,
        simulate_lolbin_abuse,
        simulate_suspicious_process_spawn,
        simulate_persistence_command,
        simulate_suspicious_file_creation,
        simulate_malicious_hash,
        simulate_suspicious_file_execution,
        simulate_malware_persistence,
        simulate_suspicious_email_link,
        simulate_malicious_attachment,
        simulate_credential_harvesting_page,
        simulate_suspicious_sender_domain,
        simulate_sql_injection,
        simulate_xss_attempt,
        simulate_directory_traversal,
        simulate_web_scanner,
        set_simulation_run_id,
    )


@dataclass(frozen=True)
class Scenario:
    """Metadata and execution plan for one AEGIS simulation scenario."""

    scenario_id: str
    category: str
    name: str
    description: str
    severity: str
    mitre_technique: str
    detection_rules: tuple[str, ...]
    expected_outcome: str
    steps: tuple[str, ...]
    runner: Callable[[str], None]
    scenario_type: str = "attack-chain"


def _authentication_brute_force(asset_id: str) -> None:
    simulate_failed_logins(asset_id, count=6)
    time.sleep(1)
    simulate_successful_login(asset_id)


def _network_reconnaissance(asset_id: str) -> None:
    simulate_port_scan(asset_id)
    time.sleep(1)
    simulate_repeated_connections(asset_id)


def _endpoint_execution_chain(asset_id: str) -> None:
    simulate_suspicious_powershell(asset_id)
    time.sleep(0.8)
    simulate_suspicious_process_spawn(asset_id)


def _phishing_to_credential_harvest(asset_id: str) -> None:
    simulate_suspicious_email_link(asset_id)
    time.sleep(0.8)
    simulate_malicious_attachment(asset_id)
    time.sleep(0.8)
    simulate_credential_harvesting_page(asset_id)


def _web_attack_chain(asset_id: str) -> None:
    simulate_sql_injection(asset_id)
    time.sleep(0.8)
    simulate_xss_attempt(asset_id)
    time.sleep(0.8)
    simulate_directory_traversal(asset_id)
    time.sleep(0.8)
    simulate_web_scanner(asset_id)


SCENARIOS: dict[str, Scenario] = {
    "AUTH-BRUTE-FORCE": Scenario(
        scenario_id="AUTH-BRUTE-FORCE",
        category="Authentication",
        name="Brute Force → Successful Login",
        description=(
            "Simulates repeated authentication failures followed by "
            "a successful login from the same source."
        ),
        severity="high",
        mitre_technique="T1110.001 — Password Guessing",
        detection_rules=("AUTH-001", "AUTH-002"),
        expected_outcome="High-severity authentication alert and incident candidate.",
        steps=(
            "Generate repeated failed logins",
            "Pause to create a realistic event sequence",
            "Generate a successful login",
            "Run AEGIS detection",
        ),
        runner=_authentication_brute_force,
    ),
    "NET-RECONNAISSANCE": Scenario(
        scenario_id="NET-RECONNAISSANCE",
        category="Network",
        name="Network Reconnaissance",
        description=(
            "Simulates port discovery followed by repeated connection "
            "attempts against an endpoint."
        ),
        severity="high",
        mitre_technique="T1046 — Network Service Discovery",
        detection_rules=("NET-001", "NET-002"),
        expected_outcome="Network reconnaissance alert and incident candidate.",
        steps=(
            "Generate multi-port connection attempts",
            "Generate repeated connections",
            "Run AEGIS detection",
        ),
        runner=_network_reconnaissance,
    ),
    "ENDPOINT-EXECUTION": Scenario(
        scenario_id="ENDPOINT-EXECUTION",
        category="Endpoint",
        name="Suspicious PowerShell Execution Chain",
        description=(
            "Simulates suspicious PowerShell telemetry followed by an "
            "unusual parent-child process relationship."
        ),
        severity="high",
        mitre_technique="T1059.001 — PowerShell",
        detection_rules=("PROC-001", "PROC-004"),
        expected_outcome="Endpoint execution alerts requiring analyst investigation.",
        steps=(
            "Generate suspicious PowerShell telemetry",
            "Generate suspicious process spawn telemetry",
            "Run AEGIS detection",
        ),
        runner=_endpoint_execution_chain,
    ),
    "PHISHING-CREDENTIAL-HARVEST": Scenario(
        scenario_id="PHISHING-CREDENTIAL-HARVEST",
        category="Phishing",
        name="Phishing → Credential Harvesting",
        description=(
            "Simulates a suspicious email link, malicious attachment, "
            "and credential-harvesting page as one user-centric campaign."
        ),
        severity="critical",
        mitre_technique="T1566.002 — Phishing: Spearphishing Link",
        detection_rules=("PHISH-001", "PHISH-002", "PHISH-003"),
        expected_outcome="Phishing incident candidate with credential-theft indicators.",
        steps=(
            "Generate suspicious email-link telemetry",
            "Generate malicious attachment telemetry",
            "Generate credential-harvesting navigation telemetry",
            "Run AEGIS detection",
        ),
        runner=_phishing_to_credential_harvest,
    ),
    "WEB-ATTACK-CHAIN": Scenario(
        scenario_id="WEB-ATTACK-CHAIN",
        category="Web Application",
        name="Web Application Attack Chain",
        description=(
            "Simulates SQL injection, XSS, directory traversal, and "
            "web enumeration against the AEGIS demo application."
        ),
        severity="high",
        mitre_technique="T1190 — Exploit Public-Facing Application",
        detection_rules=("WEB-001", "WEB-002", "WEB-003", "WEB-004"),
        expected_outcome="Multiple web alerts with a correlated web reconnaissance risk.",
        steps=(
            "Generate SQL injection telemetry",
            "Generate XSS telemetry",
            "Generate directory traversal telemetry",
            "Generate web enumeration telemetry",
            "Run AEGIS detection",
        ),
        runner=_web_attack_chain,
    ),
}



# ============================================================
# ATOMIC SCENARIO CATALOG
# ============================================================


def _register_atomic(
    scenario_id: str,
    category: str,
    name: str,
    description: str,
    severity: str,
    mitre_technique: str,
    expected_outcome: str,
    runner: Callable[[str], None],
) -> None:
    """Register one of the 28 individual detection scenarios."""
    SCENARIOS[scenario_id] = Scenario(
        scenario_id=scenario_id,
        category=category,
        name=name,
        description=description,
        severity=severity,
        mitre_technique=mitre_technique,
        detection_rules=(scenario_id,),
        expected_outcome=expected_outcome,
        steps=(
            f"Generate {name.lower()} telemetry",
            "Run AEGIS detection",
        ),
        runner=runner,
        scenario_type="atomic",
    )


# Authentication
_register_atomic(
    "AUTH-001", "Authentication", "Multiple Failed Logins",
    "Simulates repeated failed authentication attempts against one account.",
    "high", "T1110.001 — Password Guessing",
    "High-severity authentication alert.",
    lambda asset_id: simulate_failed_logins(asset_id, count=6),
)
_register_atomic(
    "AUTH-002", "Authentication", "Successful Login After Repeated Failures",
    "Simulates repeated authentication failures followed by a successful login.",
    "high", "T1110.001 — Password Guessing",
    "Authentication alert indicating a successful login after repeated failures.",
    lambda asset_id: (
        simulate_failed_logins(asset_id, count=5),
        time.sleep(1),
        simulate_successful_login(asset_id),
    )[-1],
)
def _find_unused_auth_source_ip(asset_id: str) -> str:
    """Return a synthetic private source IP never seen for this account/asset."""
    db = SessionLocal()
    try:
        used_ips = {
            row[0]
            for row in (
                db.query(SecurityEvent.source_ip)
                .filter(
                    SecurityEvent.asset_id == asset_id,
                    SecurityEvent.username == PRIMARY_USERNAME,
                    SecurityEvent.event_type == "successful_login",
                )
                .distinct()
                .all()
            )
            if row[0]
        }
    finally:
        db.close()

    # Use private RFC1918 addresses reserved for the simulation.
    # A fresh address is selected on every run, so historical telemetry
    # does not make the standalone AUTH-003 scenario stop working.
    for subnet in ("10.20.30.0/24", "10.20.31.0/24", "10.20.32.0/24"):
        for address in ipaddress.ip_network(subnet).hosts():
            candidate = str(address)
            if candidate != KNOWN_SOURCE_IP and candidate not in used_ips:
                return candidate

    raise RuntimeError("Unable to find an unused synthetic authentication source IP.")


def _simulate_fresh_new_source_login(asset_id: str) -> None:
    """Generate AUTH-003 telemetry from a source never seen for this account/asset."""
    fresh_source_ip = _find_unused_auth_source_ip(asset_id)

    print("\n[SCENARIO] AUTH-003 - Login From New Source IP")
    print(f"    Known IP: {KNOWN_SOURCE_IP}")
    print(f"    New IP:   {fresh_source_ip}")
    print("    Source validation: never previously observed for this account/asset")

    send_event(
        asset_id=asset_id,
        username=PRIMARY_USERNAME,
        event_type="successful_login",
        severity="medium",
        message="Successful login detected from previously unseen source IP",
        source_ip=fresh_source_ip,
        raw_data={
            "authentication_method": "password",
            "login_result": "success",
            "source_ip_change": True,
            "simulation": True,
            "scenario": "AUTH-003",
            "source_selection": "fresh_per_asset_user",
        },
    )


def _auth_003_with_baseline(asset_id: str) -> None:
    """Establish historical context, then generate a genuinely new source."""
    print("    [BASELINE] Establishing known successful login from 192.168.1.50")
    simulate_successful_login(asset_id)
    time.sleep(1)
    _simulate_fresh_new_source_login(asset_id)


_register_atomic(
    "AUTH-003", "Authentication", "Login From New Source IP",
    "Establishes a known login source, then simulates a successful login from a previously unseen source address.",
    "high", "T1078 — Valid Accounts",
    "New-source authentication alert after historical source validation.",
    _auth_003_with_baseline,
)
_register_atomic(
    "AUTH-004", "Authentication", "Password Spraying",
    "Simulates one source attempting authentication against multiple user accounts.",
    "high", "T1110.003 — Password Spraying",
    "Password-spraying detection alert.", simulate_password_spraying,
)
_register_atomic(
    "AUTH-005", "Authentication", "Privileged Account Login",
    "Simulates a successful login by a privileged account.",
    "high", "T1078 — Valid Accounts",
    "Privileged authentication monitoring alert.", simulate_privileged_login,
)
_register_atomic(
    "AUTH-006", "Authentication", "Account Lockout",
    "Simulates an account lockout caused by repeated authentication failures.",
    "high", "Not assigned",
    "Account lockout detection alert.", simulate_account_lockout,
)

# Network
_register_atomic(
    "NET-001", "Network", "Port Scan",
    "Simulates multi-port connection attempts against an endpoint.",
    "high", "T1046 — Network Service Discovery",
    "Network reconnaissance alert.", simulate_port_scan,
)
_register_atomic(
    "NET-002", "Network", "Repeated Connection Attempts",
    "Simulates repeated connections to the same destination and port.",
    "high", "T1046 — Network Service Discovery",
    "Repeated connection alert.", simulate_repeated_connections,
)
_register_atomic(
    "NET-003", "Network", "Unusual Destination Port",
    "Simulates a connection to an unusual destination port.",
    "medium", "T1046 — Network Service Discovery",
    "Unusual destination-port alert.", simulate_unusual_destination_port,
)
_register_atomic(
    "NET-004", "Network", "High Volume Network Connections",
    "Simulates a high volume of connections from one source.",
    "medium", "T1046 — Network Service Discovery",
    "High-volume network activity alert.", simulate_high_volume_connections,
)
_register_atomic(
    "NET-005", "Network", "Unknown External Destination",
    "Simulates a connection to an unknown external destination.",
    "medium", "Not assigned",
    "External-destination monitoring alert.", simulate_unknown_external_destination,
)

# Endpoint / Process
_register_atomic(
    "PROC-001", "Endpoint", "Suspicious PowerShell Execution",
    "Simulates suspicious PowerShell telemetry with multiple execution indicators.",
    "high", "T1059.001 — PowerShell",
    "Suspicious PowerShell alert.", simulate_suspicious_powershell,
)
_register_atomic(
    "PROC-002", "Endpoint", "Suspicious Command Shell",
    "Simulates suspicious cmd.exe activity.",
    "medium", "T1059.003 — Windows Command Shell",
    "Suspicious command-shell alert.", simulate_suspicious_cmd,
)
_register_atomic(
    "PROC-003", "Endpoint", "LOLBin Abuse",
    "Simulates telemetry involving a Windows LOLBin.",
    "high", "T1105 — Ingress Tool Transfer",
    "Potential LOLBin abuse alert.", simulate_lolbin_abuse,
)
_register_atomic(
    "PROC-004", "Endpoint", "Suspicious Process Spawn",
    "Simulates an unusual parent-child process relationship.",
    "high", "T1059.001 — PowerShell",
    "Suspicious process-chain alert.", simulate_suspicious_process_spawn,
)
_register_atomic(
    "PROC-005", "Endpoint", "Persistence Command",
    "Simulates telemetry associated with a scheduled-task persistence command.",
    "high", "T1053.005 — Scheduled Task/Job",
    "Potential persistence alert.", simulate_persistence_command,
)

# Malware
_register_atomic(
    "MAL-001", "Malware", "Suspicious File Creation",
    "Simulates creation telemetry for a suspicious executable in a temporary directory.",
    "high", "Not assigned",
    "Suspicious file creation alert.", simulate_suspicious_file_creation,
)
_register_atomic(
    "MAL-002", "Malware", "Malicious Hash / IOC Match",
    "Simulates a file hash matching the AEGIS synthetic malicious IOC.",
    "critical", "Not assigned",
    "Critical malicious-IOC alert.", simulate_malicious_hash,
)
_register_atomic(
    "MAL-003", "Malware", "Suspicious File Execution",
    "Simulates execution telemetry for a suspicious executable.",
    "high", "Not assigned",
    "Suspicious file execution alert.", simulate_suspicious_file_execution,
)
_register_atomic(
    "MAL-004", "Malware", "Malware Persistence",
    "Simulates a registry-run-key persistence indicator without modifying the registry.",
    "critical", "T1547.001 — Registry Run Keys / Startup Folder",
    "Critical persistence alert.", simulate_malware_persistence,
)

# Phishing
_register_atomic(
    "PHISH-001", "Phishing", "Suspicious Email Link",
    "Simulates an email containing a suspicious account-verification link.",
    "high", "T1566.002 — Phishing: Spearphishing Link",
    "Suspicious email-link alert.", simulate_suspicious_email_link,
)
_register_atomic(
    "PHISH-002", "Phishing", "Malicious Email Attachment",
    "Simulates receipt of a suspicious executable email attachment.",
    "high", "T1566.001 — Phishing: Spearphishing Attachment",
    "Malicious attachment alert.", simulate_malicious_attachment,
)
_register_atomic(
    "PHISH-003", "Phishing", "Credential Harvesting Page",
    "Simulates browser telemetry for a credential-harvesting page.",
    "critical", "T1056.003 — Web Portal Capture",
    "Critical credential-harvesting alert.", simulate_credential_harvesting_page,
)
_register_atomic(
    "PHISH-004", "Phishing", "Suspicious Sender / Domain",
    "Simulates an email received from a suspicious sender/domain.",
    "medium", "Not assigned",
    "Suspicious sender/domain alert.", simulate_suspicious_sender_domain,
)

# Web Application
_register_atomic(
    "WEB-001", "Web Application", "SQL Injection Attempt",
    "Simulates SQL injection request telemetry against the AEGIS demo application.",
    "high", "T1190 — Exploit Public-Facing Application",
    "SQL injection detection alert.", simulate_sql_injection,
)
_register_atomic(
    "WEB-002", "Web Application", "Cross-Site Scripting Attempt",
    "Simulates an XSS request against the AEGIS demo application.",
    "high", "T1190 — Exploit Public-Facing Application",
    "XSS detection alert.", simulate_xss_attempt,
)
_register_atomic(
    "WEB-003", "Web Application", "Directory Traversal",
    "Simulates a directory-traversal request against the AEGIS demo application.",
    "high", "T1190 — Exploit Public-Facing Application",
    "Directory-traversal detection alert.", simulate_directory_traversal,
)
_register_atomic(
    "WEB-004", "Web Application", "Web Scanner / Enumeration",
    "Simulates web enumeration against common application paths.",
    "medium", "T1046 — Network Service Discovery",
    "Web reconnaissance alert.", simulate_web_scanner,
)

def list_scenarios(scenario_type: str = "all") -> None:
    """Print the AEGIS scenario catalog."""

    if scenario_type == "atomic":
        scenarios = [s for s in SCENARIOS.values() if s.scenario_type == "atomic"]
    elif scenario_type == "chains":
        scenarios = [s for s in SCENARIOS.values() if s.scenario_type == "attack-chain"]
    else:
        scenarios = list(SCENARIOS.values())

    print("\n" + "=" * 90)
    print("AEGIS SECURITY SIMULATION ENGINE — SCENARIO CATALOG")
    print("=" * 90)

    current_type = None
    current_category = None

    for scenario in scenarios:
        if scenario.scenario_type != current_type:
            current_type = scenario.scenario_type
            current_category = None
            label = (
                "ATOMIC DETECTION SCENARIOS"
                if current_type == "atomic"
                else "ATTACK-CHAIN SCENARIOS"
            )
            print(f"\n### {label} ###")

        if scenario.category != current_category:
            current_category = scenario.category
            print(f"\n[{current_category.upper()}]")

        print(f"  {scenario.scenario_id:<30} {scenario.name}")
        print(f"      Severity: {scenario.severity:<9} MITRE: {scenario.mitre_technique}")
        print(f"      Rules: {', '.join(scenario.detection_rules)}")
        print(f"      {scenario.description}")

    atomic_count = len([s for s in SCENARIOS.values() if s.scenario_type == "atomic"])
    chain_count = len([s for s in SCENARIOS.values() if s.scenario_type == "attack-chain"])

    print("\n" + "-" * 90)
    print(f"Atomic scenarios:       {atomic_count}")
    print(f"Attack-chain scenarios: {chain_count}")
    print(f"Total scenarios:        {atomic_count + chain_count}")
    print("=" * 90)


def run_detection(rule_ids: tuple[str, ...] | list[str] | None = None) -> dict | None:
    """
    Run the AEGIS detection engine after synthetic events are submitted.

    When rule_ids are supplied, use the scenario-scoped detection support
    exposed by /detection/run so only this scenario's detection rules are
    returned and correlated into incidents.
    """

    url = f"{BASE_URL}/detection/run"
    params = None
    if rule_ids:
        params = {"rule_ids": ",".join(rule_ids)}

    try:
        response = requests.post(url, params=params, timeout=30)
        response.raise_for_status()
        result = response.json()

        print("\n[DETECTION]")
        print(f"    Status: {result.get('status', 'unknown')}")
        alerts_created = result.get("alerts_created", 0)
        alerts_updated = result.get("alerts_updated", 0)
        total_alerts = alerts_created + alerts_updated

        print("    Alerts created: ", alerts_created, sep="")
        print("    Alerts updated: ", alerts_updated, sep="")
        print("    Total alerts affected: ", total_alerts, sep="")

        alerts = result.get("alerts", [])
        if alerts:
            print("\n    Detected alerts:")
            for alert in alerts:
                print(
                    f"      - {alert.get('rule_id', 'UNKNOWN')} | "
                    f"{alert.get('title', 'Unknown Alert')} | "
                    f"severity={alert.get('severity', 'unknown')} | "
                    f"status={alert.get('status', 'unknown')} | "
                    f"events={alert.get('event_count', 0)}"
                )
        else:
            print("\n    Detected alerts: none")

        incidents_created = result.get("incidents_created", 0)
        incidents_existing = result.get("incidents_existing", 0)
        print("\n    Incidents created: ", incidents_created, sep="")
        print("    Existing incidents: ", incidents_existing, sep="")

        return result

    except requests.RequestException as error:
        print("\n[DETECTION] Detection request failed.")
        print(f"    Error: {error}")
        print("    Events were submitted, but detection must be run separately.")
        return None


def run_scenario(scenario_id: str, *, asset_id: str | None = None) -> dict:
    """Execute one registered scenario and then invoke detection."""

    scenario_key = scenario_id.upper()

    if scenario_key not in SCENARIOS:
        available = ", ".join(SCENARIOS.keys())
        raise ValueError(
            f"Unknown scenario '{scenario_id}'. Available scenarios: {available}"
        )

    scenario = SCENARIOS[scenario_key]
    simulation_run_id = (
        f"SIM-{datetime.now(timezone.utc):%Y%m%d-%H%M%S}-"
        f"{scenario.scenario_id}-{uuid.uuid4().hex[:6]}"
    )
    set_simulation_run_id(simulation_run_id)
    print(f"Simulation Run ID: {simulation_run_id}")

  

    print("\n" + "=" * 78)
    print(f"AEGIS SCENARIO: {scenario.scenario_id}")
    print("=" * 78)
    print(f"Category:       {scenario.category}")
    print(f"Scenario:       {scenario.name}")
    print(f"Severity:       {scenario.severity.upper()}")
    print(f"MITRE ATT&CK:   {scenario.mitre_technique}")
    print(f"Detection:      {', '.join(scenario.detection_rules)}")
    print(f"Description:    {scenario.description}")
    print(f"Expected:       {scenario.expected_outcome}")
    print(f"Simulation Run: {simulation_run_id}")

    if asset_id is None:
        print("\n[ASSET]")
        asset_id = register_or_discover_asset()

    print(f"\nTarget Asset ID: {asset_id}")

    print("\n[SIMULATION PLAN]")
    for index, step in enumerate(scenario.steps, start=1):
        print(f"    {index}. {step}")

    print("\n[TELEMETRY]")
    scenario.runner(asset_id)

    print("\n[SCENARIO COMPLETE]")
    print(f"    Synthetic telemetry generated for {scenario.name}")

    detection_result = run_detection(scenario.detection_rules)

    if detection_result:
        scenario_rule_ids = set(scenario.detection_rules)
        scenario_alerts = [
            alert
            for alert in detection_result.get("alerts", [])
            if alert.get("rule_id") in scenario_rule_ids
        ]

        detection_result = {
            **detection_result,
            "global_alerts_created": detection_result.get("alerts_created", 0),
            "global_alerts_updated": detection_result.get("alerts_updated", 0),
            "global_incidents_created": detection_result.get("incidents_created", 0),
            "global_incidents_existing": detection_result.get("incidents_existing", 0),
            "alerts": scenario_alerts,
            "scenario_rule_ids": list(scenario.detection_rules),
        }

        # The run-specific source context means matching alerts for this
        # scenario are newly created on a fresh run. Use the filtered
        # alert list for the console's scenario-level counts.
        current_source_ips = {
        alert.get("source_ip")
        for alert in scenario_alerts
        if alert.get("source_ip")
        }
        current_source_ips.discard(KNOWN_SOURCE_IP)
        current_run_alerts = [
            alert
            for alert in scenario_alerts
            if alert.get("source_ip") in current_source_ips
        ]
        detection_result["scenario_alerts"] = len(current_run_alerts)
        detection_result["scenario_alerts_created"] = len(current_run_alerts)
        detection_result["scenario_alerts_current_run"] = current_run_alerts
        return {
            "scenario_id": scenario.scenario_id,
            "category": scenario.category,
            "name": scenario.name,
            "severity": scenario.severity,
            "scenario_type": scenario.scenario_type,
            "mitre_technique": scenario.mitre_technique,
            "detection_rules": list(scenario.detection_rules),
            "asset_id": asset_id,
            "simulation_run_id": simulation_run_id,
            "detection": detection_result,
        }


def run_scenario_group(
    scenario_type: str,
    *,
    asset_id: str | None = None,
) -> None:
    """Run all atomic scenarios or all attack-chain scenarios."""

    scenarios = [
        scenario
        for scenario in SCENARIOS.values()
        if scenario.scenario_type == (
            "atomic" if scenario_type == "atomic" else "attack-chain"
        )
    ]

    if asset_id is None:
        asset_id = register_or_discover_asset()

    title = (
        "AEGIS ATOMIC SCENARIO SUITE"
        if scenario_type == "atomic"
        else "AEGIS ATTACK-CHAIN SCENARIO SUITE"
    )

    print("\n" + "=" * 90)
    print(title)
    print("=" * 90)
    print(f"Target Asset ID: {asset_id}")
    print(f"Scenarios:       {len(scenarios)}")

    for index, scenario in enumerate(scenarios, start=1):
        print(f"\n--- Scenario {index}/{len(scenarios)} ---")
        run_scenario(scenario.scenario_id, asset_id=asset_id)

        if index < len(scenarios):
            print("\nWaiting before next scenario...")
            time.sleep(1)

    print("\n" + "=" * 90)
    print("SCENARIO SUITE COMPLETE")
    print("=" * 90)


def run_all(asset_id: str | None = None) -> None:
    """Run every catalog scenario against the same discovered asset."""

    if asset_id is None:
        asset_id = register_or_discover_asset()

    print("\n" + "=" * 78)
    print("AEGIS FULL SIMULATION SUITE")
    print("=" * 78)
    print(f"Target Asset ID: {asset_id}")
    print(f"Scenarios:       {len(SCENARIOS)}")

    for index, scenario_id in enumerate(SCENARIOS, start=1):
        print(f"\n--- Scenario {index}/{len(SCENARIOS)} ---")
        run_scenario(scenario_id, asset_id=asset_id)

        if index < len(SCENARIOS):
            print("\nWaiting before next scenario...")
            time.sleep(2)

    print("\n" + "=" * 78)
    print("FULL SIMULATION SUITE COMPLETE")
    print("=" * 78)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="AEGIS Security Simulation Engine"
    )

    parser.add_argument(
        "--list",
        action="store_true",
        help="List available simulation scenarios.",
    )

    parser.add_argument(
        "--list-type",
        choices=("atomic", "chains", "all"),
        default="all",
        help="Filter the scenario catalog when using --list.",
    )

    parser.add_argument(
        "--scenario",
        type=str,
        help=(
            "Run one scenario by ID, ALL-ATOMIC, ALL-CHAINS, "
            "or ALL for the complete suite."
        ),
    )

    parser.add_argument(
        "--asset-id",
        type=str,
        default=None,
        help="Reuse an existing AEGIS asset ID instead of discovering an asset.",
    )

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.list:
        list_scenarios(args.list_type)
        return

    if not args.scenario:
        parser.error("Specify --list or --scenario.")

    scenario_key = args.scenario.upper()

    if scenario_key == "ALL":
        run_all(asset_id=args.asset_id)
        return

    if scenario_key == "ALL-ATOMIC":
        run_scenario_group("atomic", asset_id=args.asset_id)
        return

    if scenario_key == "ALL-CHAINS":
        run_scenario_group("chains", asset_id=args.asset_id)
        return

    result = run_scenario(
        scenario_key,
        asset_id=args.asset_id,
    )

    print("\n[RESULT]")
    print(f"    Scenario: {result['scenario_id']}")
    print(f"    Type:     {result['scenario_type']}")
    print(f"    Asset:    {result['asset_id']}")
    print("    Pipeline: Synthetic Events → Detection → Alert/Incident")


if __name__ == "__main__":
    main()
