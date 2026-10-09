from app.database import SessionLocal
from app.models.framework import Framework
from app.models.compliance_requirement import ComplianceRequirement


REQUIREMENTS = [
    # ============================================================
    # ISO/IEC 27001:2022
    # ============================================================

    {
        "framework_code": "ISO27001",
        "requirement_id": "A.5.15",
        "title": "Access control",
        "category": "Organizational controls",
        "description": (
            "Control access to information and information assets "
            "in accordance with business and information security requirements."
        ),
    },
    {
        "framework_code": "ISO27001",
        "requirement_id": "A.5.16",
        "title": "Identity management",
        "category": "Organizational controls",
        "description": (
            "Manage the full life cycle of identities used to access "
            "information and associated resources."
        ),
    },
    {
        "framework_code": "ISO27001",
        "requirement_id": "A.5.17",
        "title": "Authentication information",
        "category": "Organizational controls",
        "description": (
            "Manage authentication information through appropriate "
            "controls for assignment, protection and lifecycle management."
        ),
    },
    {
        "framework_code": "ISO27001",
        "requirement_id": "A.8.15",
        "title": "Logging",
        "category": "Technological controls",
        "description": (
            "Produce, store and protect logs relevant to information "
            "security activities and events."
        ),
    },
    {
        "framework_code": "ISO27001",
        "requirement_id": "A.8.16",
        "title": "Monitoring activities",
        "category": "Technological controls",
        "description": (
            "Monitor networks, systems and applications for anomalous "
            "behaviour and take appropriate action."
        ),
    },

    # ============================================================
    # NIST CSF 2.0
    # ============================================================

    {
        "framework_code": "NIST-CSF",
        "requirement_id": "PR.AA-01",
        "title": (
            "Identities and credentials for authorized users, "
            "services, and hardware are managed by the organization"
        ),
        "category": "Protect - Identity Management, Authentication, and Access Control",
        "description": (
            "Manage identities and credentials for authorized users, "
            "services and hardware."
        ),
    },
    {
        "framework_code": "NIST-CSF",
        "requirement_id": "PR.AA-03",
        "title": (
            "Users, services, and hardware are authenticated"
        ),
        "category": "Protect - Identity Management, Authentication, and Access Control",
        "description": (
            "Authenticate users, services and hardware using appropriate "
            "authentication mechanisms based on organizational risk."
        ),
    },
    {
        "framework_code": "NIST-CSF",
        "requirement_id": "DE.CM-01",
        "title": (
            "Networks and network services are monitored "
            "to find potentially adverse events"
        ),
        "category": "Detect - Continuous Monitoring",
        "description": (
            "Monitor networks and network services to identify "
            "potentially adverse cybersecurity events."
        ),
    },
    {
        "framework_code": "NIST-CSF",
        "requirement_id": "DE.AE-02",
        "title": (
            "Potentially adverse events are analyzed "
            "to better understand associated activities"
        ),
        "category": "Detect - Adverse Event Analysis",
        "description": (
            "Analyze potentially adverse events to understand "
            "the activities associated with them."
        ),
    },
    {
        "framework_code": "NIST-CSF",
        "requirement_id": "RS.MA-02",
        "title": "Incident reports are triaged and validated",
        "category": "Respond - Incident Management",
        "description": (
            "Triage and validate incident reports as part of "
            "the organization's incident management process."
        ),
    },

    # ============================================================
    # CIS CONTROLS v8.1
    # ============================================================

    {
        "framework_code": "CIS-CONTROLS",
        "requirement_id": "5.1",
        "title": "Establish and Maintain an Inventory of Accounts",
        "category": "CIS Control 5 - Account Management",
        "description": (
            "Maintain an inventory of user, administrator and service "
            "accounts and periodically validate that active accounts "
            "are authorized."
        ),
    },
    {
        "framework_code": "CIS-CONTROLS",
        "requirement_id": "6.3",
        "title": "Require MFA for Externally-Exposed Applications",
        "category": "CIS Control 6 - Access Control Management",
        "description": (
            "Require multifactor authentication for externally exposed "
            "enterprise or third-party applications where supported."
        ),
    },
    {
        "framework_code": "CIS-CONTROLS",
        "requirement_id": "6.4",
        "title": "Require MFA for Remote Network Access",
        "category": "CIS Control 6 - Access Control Management",
        "description": (
            "Require multifactor authentication for remote network access "
            "where applicable."
        ),
    },
    {
        "framework_code": "CIS-CONTROLS",
        "requirement_id": "8.2",
        "title": "Collect Audit Logs",
        "category": "CIS Control 8 - Audit Log Management",
        "description": (
            "Collect audit logs across enterprise assets in accordance "
            "with the organization's audit log management process."
        ),
    },
    {
        "framework_code": "CIS-CONTROLS",
        "requirement_id": "8.9",
        "title": "Centralize Audit Logs",
        "category": "CIS Control 8 - Audit Log Management",
        "description": (
            "Centralize audit log collection and retention across "
            "enterprise assets where possible, including through SIEM "
            "or other log aggregation technologies."
        ),
    },

    # ============================================================
    # SOC 2
    # ============================================================

    {
        "framework_code": "SOC2",
        "requirement_id": "CC6.1",
        "title": "Logical and Physical Access Controls",
        "category": "CC6 - Logical and Physical Access Controls",
        "description": (
            "Implement logical access security software, infrastructure "
            "and architectures to protect information assets from security events."
        ),
    },
    {
        "framework_code": "SOC2",
        "requirement_id": "CC6.2",
        "title": "New Internal Access Is Provisioned Appropriately",
        "category": "CC6 - Logical and Physical Access Controls",
        "description": (
            "Register and authorize internal users before issuing "
            "credentials that provide access to information assets."
        ),
    },
    {
        "framework_code": "SOC2",
        "requirement_id": "CC6.3",
        "title": "Internal Access Is Removed When No Longer Required",
        "category": "CC6 - Logical and Physical Access Controls",
        "description": (
            "Remove access to information assets when access is "
            "no longer required."
        ),
    },
    {
        "framework_code": "SOC2",
        "requirement_id": "CC7.2",
        "title": "Monitoring of System Components for Anomalies",
        "category": "CC7 - System Operations",
        "description": (
            "Monitor system components and their operation for anomalies "
            "indicative of malicious acts or other events, and analyze "
            "anomalies to determine whether they represent security events."
        ),
    },
    {
        "framework_code": "SOC2",
        "requirement_id": "CC7.3",
        "title": "Security Incident Evaluation and Response",
        "category": "CC7 - System Operations",
        "description": (
            "Evaluate security events to determine whether they represent "
            "security incidents and take appropriate action to prevent "
            "or address resulting failures."
        ),
    },
]


def seed_requirements():
    db = SessionLocal()

    try:
        created = 0
        skipped = 0

        frameworks = {
            framework.code: framework
            for framework in db.query(Framework).all()
        }

        for requirement_data in REQUIREMENTS:

            framework_code = requirement_data["framework_code"]

            framework = frameworks.get(framework_code)

            if not framework:
                raise RuntimeError(
                    f"Framework not found: {framework_code}"
                )

            existing = (
                db.query(ComplianceRequirement)
                .filter(
                    ComplianceRequirement.framework_id
                    == framework.id,
                    ComplianceRequirement.requirement_id
                    == requirement_data["requirement_id"],
                )
                .first()
            )

            if existing:
                print(
                    f"SKIPPED: "
                    f"{framework_code} / "
                    f"{existing.requirement_id}"
                )
                skipped += 1
                continue

            requirement = ComplianceRequirement(
                framework_id=framework.id,
                requirement_id=requirement_data["requirement_id"],
                title=requirement_data["title"],
                description=requirement_data["description"],
                category=requirement_data["category"],
                status="active",
            )

            db.add(requirement)

            print(
                f"READY: "
                f"{framework_code} / "
                f"{requirement_data['requirement_id']} - "
                f"{requirement_data['title']}"
            )

            created += 1

        db.commit()

        print()
        print("Compliance requirement seeding completed.")
        print(f"Created: {created}")
        print(f"Skipped: {skipped}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_requirements()