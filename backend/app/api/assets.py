import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetResponse


router = APIRouter(
    prefix="/assets",
    tags=["Assets"],
)


# ============================================================
# CREATE ASSET
# ============================================================

@router.post(
    "/",
    response_model=AssetResponse,
)
def create_asset(
    asset_data: AssetCreate,
    db: Session = Depends(get_db),
):

    asset = Asset(
        hostname=asset_data.hostname,
        ip_address=asset_data.ip_address,
        operating_system=asset_data.operating_system,
        asset_type=asset_data.asset_type,
        criticality=asset_data.criticality,
        owner=asset_data.owner,
        status=asset_data.status,
    )

    db.add(asset)

    db.commit()

    db.refresh(asset)

    return asset


# ============================================================
# AUTO REGISTER / DISCOVER ASSET
# ============================================================

@router.post(
    "/auto-register",
    response_model=AssetResponse,
)
def auto_register_asset(
    asset_data: AssetCreate,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Check whether this endpoint already exists
    # --------------------------------------------------------

    existing_asset = (
        db.query(Asset)
        .filter(
            Asset.hostname == asset_data.hostname
        )
        .first()
    )

    # --------------------------------------------------------
    # Existing endpoint
    # --------------------------------------------------------

    if existing_asset:

        # Update useful discovery information.

        existing_asset.ip_address = (
            asset_data.ip_address
        )

        existing_asset.operating_system = (
            asset_data.operating_system
        )

        existing_asset.asset_type = (
            asset_data.asset_type
        )

        existing_asset.criticality = (
            asset_data.criticality
        )

        existing_asset.owner = (
            asset_data.owner
        )

        existing_asset.status = "active"

        db.commit()

        db.refresh(existing_asset)

        return existing_asset

    # --------------------------------------------------------
    # New endpoint discovered
    # --------------------------------------------------------

    new_asset = Asset(
        hostname=asset_data.hostname,

        ip_address=asset_data.ip_address,

        operating_system=asset_data.operating_system,

        asset_type=asset_data.asset_type,

        criticality=asset_data.criticality,

        owner=asset_data.owner,

        status="active",
    )

    db.add(new_asset)

    db.commit()

    db.refresh(new_asset)

    return new_asset


# ============================================================
# GET ALL ASSETS
# ============================================================

@router.get(
    "/",
    response_model=list[AssetResponse],
)
def get_assets(
    db: Session = Depends(get_db),
):

    return (
        db.query(Asset)
        .order_by(
            Asset.created_at.desc()
        )
        .all()
    )


# ============================================================
# GET SINGLE ASSET
# ============================================================

@router.get(
    "/{asset_id}",
    response_model=AssetResponse,
)
def get_asset(
    asset_id: uuid.UUID,
    db: Session = Depends(get_db),
):

    asset = (
        db.query(Asset)
        .filter(
            Asset.id == asset_id
        )
        .first()
    )

    if not asset:

        raise HTTPException(
            status_code=404,
            detail="Asset not found",
        )

    return asset