from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from app.schemas.watchlist import WatchlistCreate, WatchlistUpdate, WatchlistResponse, AddWatchlistItemRequest
from app.schemas.common import ResponseEnvelope, MessagePayload
from app.services.watchlist_service import WatchlistService
from app.dependencies.portfolio_deps import get_watchlist_service
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/watchlists", tags=["Watchlists"])


@router.get("", response_model=ResponseEnvelope[List[WatchlistResponse]])
def list_watchlists(
    watchlist_service: WatchlistService = Depends(get_watchlist_service),
    current_user: User = Depends(get_current_user)
):
    watchlists = watchlist_service.list_watchlists(current_user.id)
    return ResponseEnvelope.success_response(watchlists)


@router.post("", response_model=ResponseEnvelope[WatchlistResponse], status_code=status.HTTP_201_CREATED)
def create_watchlist(
    req: WatchlistCreate,
    watchlist_service: WatchlistService = Depends(get_watchlist_service),
    current_user: User = Depends(get_current_user)
):
    wl = watchlist_service.create_watchlist(current_user.id, req)
    return ResponseEnvelope.success_response(wl)


@router.get("/{watchlist_id}", response_model=ResponseEnvelope[WatchlistResponse])
def get_watchlist(
    watchlist_id: UUID,
    watchlist_service: WatchlistService = Depends(get_watchlist_service),
    current_user: User = Depends(get_current_user)
):
    wl = watchlist_service.get_watchlist_by_id(watchlist_id, current_user.id)
    return ResponseEnvelope.success_response(wl)


@router.put("/{watchlist_id}", response_model=ResponseEnvelope[WatchlistResponse])
def update_watchlist(
    watchlist_id: UUID,
    req: WatchlistUpdate,
    watchlist_service: WatchlistService = Depends(get_watchlist_service),
    current_user: User = Depends(get_current_user)
):
    wl = watchlist_service.update_watchlist(watchlist_id, current_user.id, req)
    return ResponseEnvelope.success_response(wl)


@router.delete("/{watchlist_id}", response_model=ResponseEnvelope[MessagePayload])
def delete_watchlist(
    watchlist_id: UUID,
    watchlist_service: WatchlistService = Depends(get_watchlist_service),
    current_user: User = Depends(get_current_user)
):
    watchlist_service.delete_watchlist(watchlist_id, current_user.id)
    return ResponseEnvelope.success_response(MessagePayload(message="Watchlist deleted successfully."))


@router.post("/{watchlist_id}/items", response_model=ResponseEnvelope[WatchlistResponse])
def add_item_to_watchlist(
    watchlist_id: UUID,
    req: AddWatchlistItemRequest,
    watchlist_service: WatchlistService = Depends(get_watchlist_service),
    current_user: User = Depends(get_current_user)
):
    wl = watchlist_service.add_asset_to_watchlist(watchlist_id, current_user.id, req.asset_id)
    return ResponseEnvelope.success_response(wl)


@router.delete("/{watchlist_id}/items/{asset_id}", response_model=ResponseEnvelope[WatchlistResponse])
def remove_item_from_watchlist(
    watchlist_id: UUID,
    asset_id: UUID,
    watchlist_service: WatchlistService = Depends(get_watchlist_service),
    current_user: User = Depends(get_current_user)
):
    wl = watchlist_service.remove_asset_from_watchlist(watchlist_id, current_user.id, asset_id)
    return ResponseEnvelope.success_response(wl)
