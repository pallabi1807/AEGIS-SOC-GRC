from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.compliance_requirement import ComplianceRequirement
from app.models.control import Control
from app.models.framework import Framework
from app.models.framework_control import FrameworkControl
from app.models.remediation import Remediation
from app.models.verification import Verification
from app.schemas.compliance_requirement import (
    RequirementCreate,
    RequirementResponse,
)
from app.schemas.framework import (
    FrameworkCreate,
    FrameworkOverview,
    FrameworkResponse,
)
from app.schemas.framework_control import (
    FrameworkControlCreate,
    FrameworkControlResponse,
)

router = APIRouter(
    prefix="/compliance",
    tags=["Compliance"],
)


@router.get("/frameworks", response_model=list[FrameworkResponse])
def list_frameworks(db: Session = Depends(get_db)):
    return (
        db.query(Framework)
        .order_by(Framework.name.asc())
        .all()
    )


@router.get(
    "/frameworks/{framework_id}",
    response_model=FrameworkResponse,
)
def get_framework(
    framework_id: UUID,
    db: Session = Depends(get_db),
):
    framework = (
        db.query(Framework)
        .filter(Framework.id == framework_id)
        .first()
    )

    if not framework:
        raise HTTPException(
            status_code=404,
            detail="Framework not found.",
        )

    return framework


@router.post(
    "/frameworks",
    response_model=FrameworkResponse,
    status_code=201,
)
def create_framework(
    payload: FrameworkCreate,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Framework)
        .filter(Framework.code == payload.code)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Framework code already exists.",
        )

    framework = Framework(**payload.model_dump())
    db.add(framework)
    db.commit()
    db.refresh(framework)

    return framework


@router.get(
    "/frameworks/{framework_id}/requirements",
    response_model=list[RequirementResponse],
)
def list_requirements(
    framework_id: UUID,
    db: Session = Depends(get_db),
):
    framework_exists = (
        db.query(Framework.id)
        .filter(Framework.id == framework_id)
        .first()
    )

    if not framework_exists:
        raise HTTPException(
            status_code=404,
            detail="Framework not found.",
        )

    return (
        db.query(ComplianceRequirement)
        .filter(
            ComplianceRequirement.framework_id
            == framework_id
        )
        .order_by(
            ComplianceRequirement.requirement_id.asc()
        )
        .all()
    )


@router.post(
    "/requirements",
    response_model=RequirementResponse,
    status_code=201,
)
def create_requirement(
    payload: RequirementCreate,
    db: Session = Depends(get_db),
):
    framework = (
        db.query(Framework)
        .filter(Framework.id == payload.framework_id)
        .first()
    )

    if not framework:
        raise HTTPException(
            status_code=404,
            detail="Framework not found.",
        )

    existing = (
        db.query(ComplianceRequirement)
        .filter(
            ComplianceRequirement.framework_id
            == payload.framework_id,
            ComplianceRequirement.requirement_id
            == payload.requirement_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Requirement already exists in this framework.",
        )

    requirement = ComplianceRequirement(
        **payload.model_dump()
    )
    db.add(requirement)
    db.commit()
    db.refresh(requirement)

    return requirement


@router.get(
    "/frameworks/{framework_id}/controls",
)
def list_framework_controls(
    framework_id: UUID,
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            FrameworkControl,
            ComplianceRequirement,
            Control,
        )
        .join(
            ComplianceRequirement,
            ComplianceRequirement.id
            == FrameworkControl.requirement_id,
        )
        .join(
            Control,
            Control.id
            == FrameworkControl.control_id,
        )
        .filter(
            FrameworkControl.framework_id
            == framework_id
        )
        .order_by(
            ComplianceRequirement.requirement_id.asc(),
            Control.control_id.asc(),
        )
        .all()
    )

    return [
        {
            "id": mapping.id,
            "framework_id": mapping.framework_id,
            "requirement_id": mapping.requirement_id,
            "requirement_identifier": requirement.requirement_id,
            "requirement_title": requirement.title,
            "control_id": mapping.control_id,
            "control_identifier": control.control_id,
            "control_name": control.name,
            "mapping_type": mapping.mapping_type,
            "status": mapping.status,
            "rationale": mapping.rationale,
            "created_at": mapping.created_at,
        }
        for mapping, requirement, control in rows
    ]


@router.post(
    "/mappings",
    response_model=FrameworkControlResponse,
    status_code=201,
)
def create_mapping(
    payload: FrameworkControlCreate,
    db: Session = Depends(get_db),
):
    framework = (
        db.query(Framework)
        .filter(Framework.id == payload.framework_id)
        .first()
    )

    requirement = (
        db.query(ComplianceRequirement)
        .filter(
            ComplianceRequirement.id
            == payload.requirement_id
        )
        .first()
    )

    control = (
        db.query(Control)
        .filter(Control.id == payload.control_id)
        .first()
    )

    if not framework:
        raise HTTPException(
            status_code=404,
            detail="Framework not found.",
        )

    if not requirement:
        raise HTTPException(
            status_code=404,
            detail="Requirement not found.",
        )

    if requirement.framework_id != framework.id:
        raise HTTPException(
            status_code=400,
            detail="Requirement does not belong to the selected framework.",
        )

    if not control:
        raise HTTPException(
            status_code=404,
            detail="Control not found.",
        )

    existing = (
        db.query(FrameworkControl)
        .filter(
            FrameworkControl.requirement_id
            == payload.requirement_id,
            FrameworkControl.control_id
            == payload.control_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="This requirement-control mapping already exists.",
        )

    mapping = FrameworkControl(**payload.model_dump())
    db.add(mapping)
    db.commit()
    db.refresh(mapping)

    return mapping


@router.get(
    "/overview",
    response_model=list[FrameworkOverview],
)
def compliance_overview(
    db: Session = Depends(get_db),
):
    frameworks = (
        db.query(Framework)
        .filter(Framework.status == "active")
        .order_by(Framework.name.asc())
        .all()
    )

    results = []

    for framework in frameworks:
        total_requirements = (
            db.query(func.count(ComplianceRequirement.id))
            .filter(
                ComplianceRequirement.framework_id
                == framework.id
            )
            .scalar()
            or 0
        )

        mapped_requirement_ids = {
            row[0]
            for row in (
                db.query(
                    FrameworkControl.requirement_id
                )
                .filter(
                    FrameworkControl.framework_id
                    == framework.id
                )
                .distinct()
                .all()
            )
        }

        mapped_control_ids = {
            row[0]
            for row in (
                db.query(
                    FrameworkControl.control_id
                )
                .filter(
                    FrameworkControl.framework_id
                    == framework.id
                )
                .distinct()
                .all()
            )
        }

        verified_control_ids = {
            row[0]
            for row in (
                db.query(Verification.control_id)
                .filter(
                    Verification.control_id.in_(
                        mapped_control_ids
                    ),
                    Verification.result == "PASS",
                )
                .distinct()
                .all()
            )
            if row[0] is not None
        }

        coverage = (
            round(
                (
                    len(mapped_requirement_ids)
                    / total_requirements
                )
                * 100,
                1,
            )
            if total_requirements
            else 0.0
        )

        results.append(
            FrameworkOverview(
                id=framework.id,
                code=framework.code,
                name=framework.name,
                version=framework.version,
                total_requirements=total_requirements,
                mapped_requirements=len(
                    mapped_requirement_ids
                ),
                mapped_controls=len(
                    mapped_control_ids
                ),
                verified_controls=len(
                    verified_control_ids
                ),
                coverage_percentage=coverage,
            )
        )

    return results
