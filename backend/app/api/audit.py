from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogResponse


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Trail"],
)


# ============================================================
# LIST AUDIT LOGS
# ============================================================

@router.get(
    "",
    response_model=list[AuditLogResponse],
)
def get_audit_logs(
    db: Session = Depends(get_db),
):
    return (
        db.query(AuditLog)
        .order_by(
            AuditLog.timestamp.desc()
        )
        .all()
    )


# ============================================================
# GET AUDIT LOG
# ============================================================

@router.get(
    "/{audit_log_id}",
    response_model=AuditLogResponse,
)
def get_audit_log(
    audit_log_id: UUID,
    db: Session = Depends(get_db),
):
    audit_log = (
        db.query(AuditLog)
        .filter(
            AuditLog.id == audit_log_id
        )
        .first()
    )

    if not audit_log:
        raise HTTPException(
            status_code=404,
            detail="Audit log not found",
        )

    return audit_log