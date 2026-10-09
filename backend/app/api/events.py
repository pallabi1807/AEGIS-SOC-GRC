import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.asset import Asset
from app.models.security_event import SecurityEvent
from app.schemas.event import (
    SecurityEventCreate,
    SecurityEventResponse,
)


router = APIRouter(
    prefix="/events",
    tags=["Security Events"],
)


@router.post("/", response_model=SecurityEventResponse)
def create_event(
    event_data: SecurityEventCreate,
    db: Session = Depends(get_db),
):
    # Validate the asset if an asset_id was supplied
    if event_data.asset_id is not None:
        asset = db.query(Asset).filter(
            Asset.id == event_data.asset_id
        ).first()

        if not asset:
            raise HTTPException(
                status_code=404,
                detail="Asset not found",
            )

    event = SecurityEvent(
        asset_id=event_data.asset_id,
        timestamp=event_data.timestamp,
        source=event_data.source,
        event_type=event_data.event_type,
        severity=event_data.severity,
        message=event_data.message,
        source_ip=event_data.source_ip,
        username=event_data.username,
        raw_data=event_data.raw_data,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event


@router.get("/", response_model=list[SecurityEventResponse])
def get_events(
    db: Session = Depends(get_db),
):
    return db.query(SecurityEvent).order_by(
        SecurityEvent.timestamp.desc()
    ).all()


@router.get("/{event_id}", response_model=SecurityEventResponse)
def get_event(
    event_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    event = db.query(SecurityEvent).filter(
        SecurityEvent.id == event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Security event not found",
        )

    return event