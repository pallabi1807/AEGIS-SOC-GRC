from uuid import UUID

from sqlalchemy.orm import Session

from app.models.control import Control
from app.models.control_test import ControlTest
from app.models.evidence import Evidence


def generate_test_number(db: Session) -> str:
    count = db.query(ControlTest).count()
    return f"CT-{count + 1:06d}"


def create_control_test(
    db: Session,
    control_id: UUID,
    evidence_id: UUID,
    test_procedure: str,
    result: str,
    findings: str | None = None,
    tester: str = "analyst",
    notes: str | None = None,
):
    # Validate result
    allowed_results = {"PASS", "FAIL", "PARTIAL"}

    if result not in allowed_results:
        raise ValueError(
            "Invalid test result. Use PASS, FAIL, or PARTIAL."
        )

    # Verify control exists
    control = (
        db.query(Control)
        .filter(Control.id == control_id)
        .first()
    )

    if not control:
        raise ValueError("Control not found.")

    # Verify evidence exists
    evidence = (
        db.query(Evidence)
        .filter(Evidence.id == evidence_id)
        .first()
    )

    if not evidence:
        raise ValueError("Evidence not found.")

    # Make sure evidence belongs to the selected control
    if evidence.control_id != control_id:
        raise ValueError(
            "Evidence is not linked to the selected control."
        )

    # Prevent duplicate testing of the same evidence for the same control
    existing = (
        db.query(ControlTest)
        .filter(
            ControlTest.control_id == control_id,
            ControlTest.evidence_id == evidence_id,
        )
        .first()
    )

    if existing:
        return existing, False

    test = ControlTest(
        test_number=generate_test_number(db),
        control_id=control_id,
        evidence_id=evidence_id,
        test_procedure=test_procedure,
        result=result,
        findings=findings,
        tester=tester,
        notes=notes,
    )

    db.add(test)
    db.commit()
    db.refresh(test)

    return test, True