from uuid import UUID

from sqlalchemy.orm import Session

from app.models.evidence import Evidence
from app.models.control import Control
from app.models.remediation import Remediation
from app.models.verification import Verification


def generate_verification_number(db: Session) -> str:
    count = db.query(Verification).count()
    return f"VER-{count + 1:06d}"


def create_verification(
    db: Session,
    remediation_id: UUID,
    control_id: UUID,
    verification_procedure: str,
    result: str,
    findings: str | None = None,
    verifier: str = "analyst",
    notes: str | None = None,
):
    """
    Create a remediation verification.

    Verification is allowed only when:

    1. Remediation exists.
    2. Remediation is completed.
    3. Control exists.
    4. Control matches the remediation.
    5. Valid evidence exists for the control.
    6. Evidence is collected.
    7. Evidence integrity is verified.
    8. Evidence has been accepted by an analyst.
    """

    # ---------------------------------------------------------
    # Validate verification result
    # ---------------------------------------------------------

    allowed_results = {
        "PASS",
        "FAIL",
        "PARTIAL",
    }

    if result not in allowed_results:
        raise ValueError(
            f"Invalid verification result: {result}"
        )

    # ---------------------------------------------------------
    # Validate remediation
    # ---------------------------------------------------------

    remediation = (
        db.query(Remediation)
        .filter(Remediation.id == remediation_id)
        .first()
    )

    if not remediation:
        raise ValueError(
            "Remediation not found."
        )

    if remediation.status != "completed":
        raise ValueError(
            "Remediation must be completed before verification."
        )

    # ---------------------------------------------------------
    # Validate control
    # ---------------------------------------------------------

    control = (
        db.query(Control)
        .filter(Control.id == control_id)
        .first()
    )

    if not control:
        raise ValueError(
            "Control not found."
        )

    if remediation.control_id != control_id:
        raise ValueError(
            "Control does not match the remediation."
        )

    # ---------------------------------------------------------
    # Validate evidence
    # ---------------------------------------------------------

    evidence = (
        db.query(Evidence)
        .filter(
            Evidence.control_id == control_id,
            Evidence.status == "collected",
            Evidence.integrity_status == "verified",
            Evidence.review_status == "accepted",
        )
        .order_by(
            Evidence.collected_at.desc()
        )
        .first()
    )

    if not evidence:
        raise ValueError(
            "Verification requires collected, "
            "integrity-verified, and analyst-accepted "
            "evidence for the associated control."
        )

    # ---------------------------------------------------------
    # Create verification
    # ---------------------------------------------------------

    verification = Verification(
        verification_number=generate_verification_number(db),
        remediation_id=remediation_id,
        control_id=control_id,
        verification_procedure=verification_procedure,
        result=result,
        findings=findings,
        verifier=verifier,
        notes=notes,
    )

    db.add(verification)

    # ---------------------------------------------------------
    # Update remediation verification status
    # ---------------------------------------------------------

    if result == "PASS":
        remediation.verification_status = "verified"

    elif result == "FAIL":
        remediation.verification_status = "failed"

    else:
        remediation.verification_status = "pending"

    remediation.verification_notes = (
        findings if findings else notes
    )

    db.commit()
    db.refresh(verification)

    return verification