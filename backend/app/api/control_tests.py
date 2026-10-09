from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.control_test import ControlTest
from app.schemas.control_test import (
    ControlTestCreate,
    ControlTestResponse,
)
from app.services.control_test_service import create_control_test


router = APIRouter(
    prefix="/control-tests",
    tags=["Control Testing"],
)


# ============================================================
# LIST CONTROL TESTS
# ============================================================

@router.get(
    "",
    response_model=list[ControlTestResponse],
)
def get_control_tests(
    db: Session = Depends(get_db),
):
    tests = (
        db.query(ControlTest)
        .order_by(
            ControlTest.created_at.desc()
        )
        .all()
    )

    return tests


# ============================================================
# GET CONTROL TEST BY ID
# ============================================================

@router.get(
    "/{test_id}",
    response_model=ControlTestResponse,
)
def get_control_test(
    test_id: UUID,
    db: Session = Depends(get_db),
):
    test = (
        db.query(ControlTest)
        .filter(
            ControlTest.id == test_id
        )
        .first()
    )

    if not test:
        raise HTTPException(
            status_code=404,
            detail="Control test not found",
        )

    return test


# ============================================================
# CREATE CONTROL TEST
# ============================================================

@router.post(
    "",
    response_model=ControlTestResponse,
)
def create_new_control_test(
    test_data: ControlTestCreate,
    db: Session = Depends(get_db),
):
    try:
        test, created = create_control_test(
            db=db,
            control_id=test_data.control_id,
            evidence_id=test_data.evidence_id,
            test_procedure=test_data.test_procedure,
            result=test_data.result,
            findings=test_data.findings,
            tester=test_data.tester,
            notes=test_data.notes,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    return test


# ============================================================
# LIST TESTS FOR A CONTROL
# ============================================================

@router.get(
    "/control/{control_id}",
    response_model=list[ControlTestResponse],
)
def get_control_tests(
    control_id: UUID,
    db: Session = Depends(get_db),
):
    tests = (
        db.query(ControlTest)
        .filter(
            ControlTest.control_id == control_id
        )
        .order_by(
            ControlTest.created_at.desc()
        )
        .all()
    )

    return tests