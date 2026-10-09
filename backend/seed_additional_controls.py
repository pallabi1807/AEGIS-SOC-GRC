from app.database import SessionLocal
from app.models.control import Control


NEW_CONTROLS = [
    {
        "control_id": "CTRL-END-001",
        "name": "Endpoint Protection and Monitoring",
        "description": "Deploy and monitor endpoint security controls to detect and respond to malicious activity on organizational endpoints.",
        "control_type": "preventive",
    },
    {
        "control_id": "CTRL-END-002",
        "name": "Secure Endpoint Configuration",
        "description": "Maintain secure baseline configurations for organizational endpoints and periodically review configuration compliance.",
        "control_type": "preventive",
    },
    {
        "control_id": "CTRL-LOG-001",
        "name": "Centralized Security Logging",
        "description": "Collect security-relevant logs from organizational systems and security tools into a centralized logging capability.",
        "control_type": "detective",
    },
    {
        "control_id": "CTRL-LOG-002",
        "name": "Log Retention and Review",
        "description": "Retain security logs for defined periods and periodically review them for security events and anomalies.",
        "control_type": "detective",
    },
    {
        "control_id": "CTRL-INC-001",
        "name": "Incident Response Management",
        "description": "Maintain and execute documented processes for identifying, responding to, containing, and recovering from security incidents.",
        "control_type": "corrective",
    },
    {
        "control_id": "CTRL-INC-002",
        "name": "Incident Triage and Escalation",
        "description": "Triage security incidents using defined criteria and escalate incidents according to severity and organizational response procedures.",
        "control_type": "detective",
    },
    {
        "control_id": "CTRL-ACC-001",
        "name": "Privileged Access Management",
        "description": "Restrict, monitor, and review privileged access to systems and administrative functions.",
        "control_type": "preventive",
    },
    {
        "control_id": "CTRL-ACC-002",
        "name": "User Access Review",
        "description": "Periodically review user and service account access to confirm that permissions remain authorized and appropriate.",
        "control_type": "detective",
    },
    {
        "control_id": "CTRL-VULN-001",
        "name": "Vulnerability Management",
        "description": "Identify, assess, prioritize, and track vulnerabilities affecting organizational systems and applications.",
        "control_type": "preventive",
    },
    {
        "control_id": "CTRL-PATCH-001",
        "name": "Security Patch Management",
        "description": "Apply security patches and updates to supported systems according to defined risk and remediation priorities.",
        "control_type": "preventive",
    },
    {
        "control_id": "CTRL-DATA-001",
        "name": "Data Backup and Recovery",
        "description": "Maintain protected backups and periodically validate the ability to recover critical organizational data.",
        "control_type": "corrective",
    },
    {
        "control_id": "CTRL-SEC-001",
        "name": "Security Awareness and Phishing Training",
        "description": "Provide security awareness and phishing training to personnel and periodically assess security awareness effectiveness.",
        "control_type": "preventive",
    },
]


def seed_controls():
    db = SessionLocal()

    try:
        added = 0
        skipped = 0

        for data in NEW_CONTROLS:
            existing = (
                db.query(Control)
                .filter(Control.control_id == data["control_id"])
                .first()
            )

            if existing:
                print(
                    f"SKIPPED | {existing.control_id} | "
                    f"{existing.name}"
                )
                skipped += 1
                continue

            control = Control(
                control_id=data["control_id"],
                name=data["name"],
                description=data["description"],
                control_type=data["control_type"],
                status="planned",
                owner=None,
            )

            db.add(control)

            print(
                f"ADDED   | {data['control_id']} | "
                f"{data['name']}"
            )

            added += 1

        db.commit()

        print()
        print("========================================")
        print("CONTROL CATALOG SEED COMPLETE")
        print("========================================")
        print(f"Added:   {added}")
        print(f"Skipped: {skipped}")
        print(f"Total new definitions: {len(NEW_CONTROLS)}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_controls()