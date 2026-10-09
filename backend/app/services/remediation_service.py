from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.control import Control
from app.models.remediation import Remediation
from app.models.risk import Risk
from app.models.risk_control import RiskControl


def generate_remediation_number(db: Session) -> str:
    count = db.query(Remediation).count()
    return f"REM-{count + 1:06d}"


def create_remediation(
    db: Session,
    title: str,
    description: str,
    priority: str = "medium",
    risk_id: UUID | None = None,
    control_id: UUID | None = None,
    owner: str | None = None,
    due_date=None,
):
    if risk_id:
        risk = (
            db.query(Risk)
            .filter(Risk.id == risk_id)
            .first()
        )

        if not risk:
            raise ValueError("Risk not found.")

    if control_id:
        control = (
            db.query(Control)
            .filter(Control.id == control_id)
            .first()
        )

        if not control:
            raise ValueError("Control not found.")

    remediation = Remediation(
        remediation_number=generate_remediation_number(db),
        title=title,
        description=description,
        status="open",
        priority=priority,
        risk_id=risk_id,
        control_id=control_id,
        owner=owner,
        due_date=due_date,
        verification_status="not_verified",
    )

    db.add(remediation)
    db.commit()
    db.refresh(remediation)

    return remediation


def create_remediations_from_risk(
    db: Session,
    risk_id: UUID,
):
    risk = (
        db.query(Risk)
        .filter(Risk.id == risk_id)
        .first()
    )

    if not risk:
        raise ValueError("Risk not found.")

    relationships = (
        db.query(RiskControl)
        .filter(RiskControl.risk_id == risk_id)
        .all()
    )

    created_remediations = []

    for relationship in relationships:
        control = (
            db.query(Control)
            .filter(Control.id == relationship.control_id)
            .first()
        )

        if not control:
            continue

        existing = (
            db.query(Remediation)
            .filter(
                Remediation.risk_id == risk_id,
                Remediation.control_id == control.id,
            )
            .first()
        )

        if existing:
            created_remediations.append(existing)
            continue

        remediation = Remediation(
            remediation_number=generate_remediation_number(db),
            title=f"Remediate {control.name}",
            description=(
                f"Implement and maintain the '{control.name}' "
                f"control to mitigate risk {risk.risk_number}. "
                f"This remediation was automatically generated "
                f"by the AEGIS SOC-GRC workflow."
            ),
            status="open",
            priority=risk.risk_level.lower(),
            risk_id=risk.id,
            control_id=control.id,
            owner=None,
            verification_status="not_verified",
        )

        db.add(remediation)
        db.flush()

        created_remediations.append(remediation)

    db.commit()

    for remediation in created_remediations:
        db.refresh(remediation)

    return created_remediations


def update_remediation_status(
    db: Session,
    remediation: Remediation,
    status: str,
    verification_status: str | None = None,
    verification_notes: str | None = None,
):
    allowed_statuses = {
        "open",
        "in_progress",
        "completed",
        "closed",
    }

    allowed_verification = {
        "not_verified",
        "pending",
        "verified",
        "failed",
    }

    if status not in allowed_statuses:
        raise ValueError(
            f"Invalid remediation status: {status}"
        )

    if verification_status is not None:
        if verification_status not in allowed_verification:
            raise ValueError(
                f"Invalid verification status: "
                f"{verification_status}"
            )

    remediation.status = status

    if verification_status is not None:
        remediation.verification_status = verification_status

    if verification_notes is not None:
        remediation.verification_notes = verification_notes

    if status == "completed":
        remediation.completed_at = datetime.now(timezone.utc)

    remediation.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(remediation)

    return remediation