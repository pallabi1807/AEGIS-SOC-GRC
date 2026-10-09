from app.database import Base, engine
from app.models import (
    Asset,
    SecurityEvent,
    Alert,
    AuditLog,
)

# Import compliance models so SQLAlchemy registers their tables
# before Base.metadata.create_all() runs.
from app.models.framework import Framework
from app.models.compliance_requirement import ComplianceRequirement
from app.models.framework_control import FrameworkControl


def init_database():
    print("Creating AEGIS database tables...")

    Base.metadata.create_all(bind=engine)

    print("Database tables created successfully.")


if __name__ == "__main__":
    init_database()