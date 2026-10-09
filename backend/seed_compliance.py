from app.database import SessionLocal
from app.models.framework import Framework


FRAMEWORKS = [
    {
        "code": "ISO27001",
        "name": "ISO/IEC 27001",
        "version": "2022",
        "description": (
            "Information security management system standard providing "
            "requirements for establishing, implementing, maintaining, "
            "and continually improving an information security management system."
        ),
        "status": "active",
    },
    {
        "code": "NIST-CSF",
        "name": "NIST Cybersecurity Framework",
        "version": "2.0",
        "description": (
            "Cybersecurity framework providing guidance for managing "
            "cybersecurity risk through the Govern, Identify, Protect, "
            "Detect, Respond, and Recover functions."
        ),
        "status": "active",
    },
    {
        "code": "CIS-CONTROLS",
        "name": "CIS Controls",
        "version": "v8.1",
        "description": (
            "Prioritized set of safeguards designed to help organizations "
            "defend against common and prevalent cyber attacks."
        ),
        "status": "active",
    },
    {
        "code": "SOC2",
        "name": "SOC 2",
        "version": "Trust Services Criteria",
        "description": (
            "Trust Services Criteria used to evaluate controls relevant "
            "to security, availability, processing integrity, confidentiality, "
            "and privacy."
        ),
        "status": "active",
    },
]


def seed_frameworks():
    db = SessionLocal()

    try:
        created = 0
        skipped = 0

        for framework_data in FRAMEWORKS:
            existing = (
                db.query(Framework)
                .filter(Framework.code == framework_data["code"])
                .first()
            )

            if existing:
                print(f"SKIPPED: {existing.code} - {existing.name}")
                skipped += 1
                continue

            framework = Framework(**framework_data)
            db.add(framework)

            print(
                f"READY: {framework_data['code']} - "
                f"{framework_data['name']}"
            )

            created += 1

        db.commit()

        print()
        print("Compliance framework seeding completed.")
        print(f"Created: {created}")
        print(f"Skipped: {skipped}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_frameworks()