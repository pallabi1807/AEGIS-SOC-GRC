from app.database import SessionLocal
from app.models.framework import Framework
from app.models.compliance_requirement import ComplianceRequirement
from app.models.framework_control import FrameworkControl
from app.models.control import Control


MAPPINGS = [
    # ============================================================
    # ISO/IEC 27001:2022
    # ============================================================

    {
        "framework_code": "ISO27001",
        "requirement_id": "A.5.15",
        "control_identifier": "CTRL-AUTH-001",
        "mapping_type": "direct",
        "rationale": (
            "AEGIS Account Lockout and Authentication Monitoring "
            "provides detective monitoring relevant to access-control "
            "events and authentication activity."
        ),
    },
    {
        "framework_code": "ISO27001",
        "requirement_id": "A.5.16",
        "control_identifier": "CTRL-AUTH-001",
        "mapping_type": "supporting",
        "rationale": (
            "AEGIS authentication monitoring provides visibility into "
            "account activity relevant to identity lifecycle oversight."
        ),
    },
    {
        "framework_code": "ISO27001",
        "requirement_id": "A.5.17",
        "control_identifier": "CTRL-AUTH-002",
        "mapping_type": "direct",
        "rationale": (
            "AEGIS Multi-Factor Authentication is directly relevant "
            "to strengthening authentication mechanisms."
        ),
    },
    {
        "framework_code": "ISO27001",
        "requirement_id": "A.8.15",
        "control_identifier": "CTRL-NET-001",
        "mapping_type": "supporting",
        "rationale": (
            "AEGIS Network Monitoring provides security-event visibility "
            "that can contribute to monitoring and log analysis."
        ),
    },
    {
        "framework_code": "ISO27001",
        "requirement_id": "A.8.16",
        "control_identifier": "CTRL-NET-001",
        "mapping_type": "direct",
        "rationale": (
            "AEGIS Network Monitoring directly supports monitoring "
            "network activity for potentially anomalous behaviour."
        ),
    },

    # ============================================================
    # NIST CSF 2.0
    # ============================================================

    {
        "framework_code": "NIST-CSF",
        "requirement_id": "PR.AA-01",
        "control_identifier": "CTRL-AUTH-001",
        "mapping_type": "supporting",
        "rationale": (
            "AEGIS authentication monitoring provides visibility into "
            "account and authentication activity."
        ),
    },
    {
        "framework_code": "NIST-CSF",
        "requirement_id": "PR.AA-03",
        "control_identifier": "CTRL-AUTH-002",
        "mapping_type": "direct",
        "rationale": (
            "AEGIS Multi-Factor Authentication directly supports "
            "strong authentication of users."
        ),
    },
    {
        "framework_code": "NIST-CSF",
        "requirement_id": "DE.CM-01",
        "control_identifier": "CTRL-NET-001",
        "mapping_type": "direct",
        "rationale": (
            "AEGIS Network Monitoring directly supports monitoring "
            "of networks and network services for adverse events."
        ),
    },
    {
        "framework_code": "NIST-CSF",
        "requirement_id": "DE.AE-02",
        "control_identifier": "CTRL-NET-001",
        "mapping_type": "supporting",
        "rationale": (
            "Network monitoring provides event data that can be "
            "analyzed to understand potentially adverse activities."
        ),
    },

    # ============================================================
    # CIS CONTROLS v8.1
    # ============================================================

    {
        "framework_code": "CIS-CONTROLS",
        "requirement_id": "6.3",
        "control_identifier": "CTRL-AUTH-002",
        "mapping_type": "direct",
        "rationale": (
            "AEGIS Multi-Factor Authentication directly supports "
            "MFA for externally exposed applications where applicable."
        ),
    },
    {
        "framework_code": "CIS-CONTROLS",
        "requirement_id": "6.4",
        "control_identifier": "CTRL-AUTH-002",
        "mapping_type": "direct",
        "rationale": (
            "AEGIS Multi-Factor Authentication directly supports "
            "MFA for remote access scenarios where applicable."
        ),
    },
    {
        "framework_code": "CIS-CONTROLS",
        "requirement_id": "8.2",
        "control_identifier": "CTRL-NET-001",
        "mapping_type": "supporting",
        "rationale": (
            "AEGIS Network Monitoring consumes security telemetry "
            "that contributes to audit and security-event visibility."
        ),
    },
    {
        "framework_code": "CIS-CONTROLS",
        "requirement_id": "8.9",
        "control_identifier": "CTRL-NET-001",
        "mapping_type": "supporting",
        "rationale": (
            "AEGIS Network Monitoring provides centralized visibility "
            "of network security events within the SOC workflow."
        ),
    },

    # ============================================================
    # SOC 2
    # ============================================================

    {
        "framework_code": "SOC2",
        "requirement_id": "CC6.1",
        "control_identifier": "CTRL-AUTH-002",
        "mapping_type": "direct",
        "rationale": (
            "AEGIS Multi-Factor Authentication supports logical "
            "access protection through stronger authentication."
        ),
    },
    {
        "framework_code": "SOC2",
        "requirement_id": "CC6.2",
        "control_identifier": "CTRL-AUTH-001",
        "mapping_type": "supporting",
        "rationale": (
            "AEGIS authentication monitoring provides visibility "
            "into access activity associated with internal accounts."
        ),
    },
    {
        "framework_code": "SOC2",
        "requirement_id": "CC7.2",
        "control_identifier": "CTRL-NET-001",
        "mapping_type": "direct",
        "rationale": (
            "AEGIS Network Monitoring directly supports detection "
            "and analysis of anomalous network activity."
        ),
    },
    {
        "framework_code": "SOC2",
        "requirement_id": "CC7.3",
        "control_identifier": "CTRL-WEB-004",
        "mapping_type": "supporting",
        "rationale": (
            "AEGIS Web Access Monitoring provides security-event "
            "visibility that can support evaluation of web-related "
            "security events."
        ),
    },
]


def seed_mappings():
    db = SessionLocal()

    try:
        created = 0
        skipped = 0

        frameworks = {
            framework.code: framework
            for framework in db.query(Framework).all()
        }

        controls = {
            control.control_id: control
            for control in db.query(Control).all()
        }

        for mapping_data in MAPPINGS:

            framework = frameworks.get(
                mapping_data["framework_code"]
            )

            if not framework:
                raise RuntimeError(
                    "Framework not found: "
                    f"{mapping_data['framework_code']}"
                )

            control = controls.get(
                mapping_data["control_identifier"]
            )

            if not control:
                raise RuntimeError(
                    "Control not found: "
                    f"{mapping_data['control_identifier']}"
                )

            requirement = (
                db.query(ComplianceRequirement)
                .filter(
                    ComplianceRequirement.framework_id
                    == framework.id,
                    ComplianceRequirement.requirement_id
                    == mapping_data["requirement_id"],
                )
                .first()
            )

            if not requirement:
                raise RuntimeError(
                    "Requirement not found: "
                    f"{mapping_data['framework_code']} / "
                    f"{mapping_data['requirement_id']}"
                )

            existing = (
                db.query(FrameworkControl)
                .filter(
                    FrameworkControl.requirement_id
                    == requirement.id,
                    FrameworkControl.control_id
                    == control.id,
                )
                .first()
            )

            if existing:
                print(
                    "SKIPPED: "
                    f"{mapping_data['framework_code']} / "
                    f"{mapping_data['requirement_id']} -> "
                    f"{mapping_data['control_identifier']}"
                )
                skipped += 1
                continue

            mapping = FrameworkControl(
                framework_id=framework.id,
                requirement_id=requirement.id,
                control_id=control.id,
                mapping_type=mapping_data["mapping_type"],
                status="mapped",
                rationale=mapping_data["rationale"],
            )

            db.add(mapping)

            print(
                "READY: "
                f"{mapping_data['framework_code']} / "
                f"{mapping_data['requirement_id']} -> "
                f"{mapping_data['control_identifier']}"
            )

            created += 1

        db.commit()

        print()
        print("Compliance mapping seeding completed.")
        print(f"Created: {created}")
        print(f"Skipped: {skipped}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_mappings()