from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from app.schemas.asset import AssetResponse
from app.schemas.common import ResponseEnvelope
from app.services.asset_service import AssetService
from app.dependencies.portfolio_deps import get_asset_service
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/assets", tags=["Asset Master"])


@router.get("", response_model=ResponseEnvelope[List[AssetResponse]])
def list_assets(
    asset_service: AssetService = Depends(get_asset_service),
    current_user: User = Depends(get_current_user)
):
    assets = asset_service.list_assets()
    dtos = [AssetResponse.model_validate(a) for a in assets]
    return ResponseEnvelope.success_response(dtos)


@router.get("/search", response_model=ResponseEnvelope[List[AssetResponse]])
def search_assets(
    q: str = Query(..., min_length=1),
    asset_service: AssetService = Depends(get_asset_service),
    current_user: User = Depends(get_current_user)
):
    assets = asset_service.search_assets(q)
    dtos = [AssetResponse.model_validate(a) for a in assets]
    return ResponseEnvelope.success_response(dtos)


@router.get("/{asset_id}", response_model=ResponseEnvelope[AssetResponse])
def get_asset(
    asset_id: UUID,
    asset_service: AssetService = Depends(get_asset_service),
    current_user: User = Depends(get_current_user)
):
    asset = asset_service.get_asset_by_id(asset_id)
    return ResponseEnvelope.success_response(AssetResponse.model_validate(asset))
