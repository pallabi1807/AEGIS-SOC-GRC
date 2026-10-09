import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.alert import Alert
from app.schemas.alert import (
    AlertResponse,
    AlertStatusUpdate,
)
from app.services.audit_service import record_audit_event


router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"],
)


# ============================================================
# GET ALL ALERTS
# ============================================================

@router.get(
    "",
    response_model=list[AlertResponse],
)
def get_alerts(
    db: Session = Depends(get_db),
):
    return (
        db.query(Alert)
        .order_by(
            Alert.created_at.desc()
        )
        .all()
    )


# ============================================================
# GET SINGLE ALERT
# ============================================================

@router.get(
    "/{alert_id}",
    response_model=AlertResponse,
)
def get_alert(
    alert_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    alert = (
        db.query(Alert)
        .filter(
            Alert.id == alert_id
        )
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    return alert


# ============================================================
# UPDATE ALERT STATUS
# ============================================================

@router.patch(
    "/{alert_id}/status",
    response_model=AlertResponse,
)
def update_alert_status(
    alert_id: uuid.UUID,
    status_data: AlertStatusUpdate,
    db: Session = Depends(get_db),
):
    alert = (
        db.query(Alert)
        .filter(
            Alert.id == alert_id
        )
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    old_status = alert.status
    new_status = status_data.status

    # --------------------------------------------------------
    # No audit event when there is no actual change
    # --------------------------------------------------------

    if old_status == new_status:
        return alert

    # --------------------------------------------------------
    # Update alert
    # --------------------------------------------------------

    alert.status = new_status

    db.commit()
    db.refresh(alert)

    # --------------------------------------------------------
    # Record audit event
    # --------------------------------------------------------

    record_audit_event(
        db=db,
        actor="system",
        action="ALERT_STATUS_CHANGED",
        entity_type="Alert",
        entity_id=alert.id,
        description=(
            f"Alert status changed from "
            f"{old_status} to {new_status}."
        ),
        old_value=old_status,
        new_value=new_status,
        source="alerts",
    )

    return alert