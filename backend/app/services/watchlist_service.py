from uuid import UUID
from typing import List
from fastapi import HTTPException, status
from app.models.watchlist import Watchlist, WatchlistItem
from app.repositories.watchlist_repository import WatchlistRepository
from app.repositories.asset_repository import AssetRepository
from app.schemas.watchlist import WatchlistCreate, WatchlistUpdate, WatchlistResponse, WatchlistItemResponse


class WatchlistService:
    def __init__(self, watchlist_repo: WatchlistRepository, asset_repo: AssetRepository):
        self.watchlist_repo = watchlist_repo
        self.asset_repo = asset_repo

    def list_watchlists(self, user_id: UUID) -> List[WatchlistResponse]:
        watchlists = self.watchlist_repo.list_by_user(user_id)
        if not watchlists:
            # Create default watchlist if none exists
            default_wl = Watchlist(
                user_id=user_id,
                name="Default Watchlist",
                description="Core watchlist"
            )
            created = self.watchlist_repo.create(default_wl)
            watchlists = [created]

        return [self._format_response(wl) for wl in watchlists]

    def get_watchlist_by_id(self, watchlist_id: UUID, user_id: UUID) -> WatchlistResponse:
        watchlist = self.watchlist_repo.get_by_id(watchlist_id, user_id=user_id)
        if not watchlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Watchlist not found or access denied."
            )
        return self._format_response(watchlist)

    def create_watchlist(self, user_id: UUID, req: WatchlistCreate) -> WatchlistResponse:
        wl = Watchlist(
            user_id=user_id,
            name=req.name,
            description=req.description
        )
        created = self.watchlist_repo.create(wl)
        return self._format_response(created)

    def update_watchlist(self, watchlist_id: UUID, user_id: UUID, req: WatchlistUpdate) -> WatchlistResponse:
        wl = self.watchlist_repo.get_by_id(watchlist_id, user_id=user_id)
        if not wl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Watchlist not found or access denied."
            )
        if req.name is not None:
            wl.name = req.name
        if req.description is not None:
            wl.description = req.description
        updated = self.watchlist_repo.update(wl)
        return self._format_response(updated)

    def delete_watchlist(self, watchlist_id: UUID, user_id: UUID) -> None:
        wl = self.watchlist_repo.get_by_id(watchlist_id, user_id=user_id)
        if not wl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Watchlist not found or access denied."
            )
        self.watchlist_repo.delete(wl)

    def add_asset_to_watchlist(self, watchlist_id: UUID, user_id: UUID, asset_id: UUID) -> WatchlistResponse:
        wl = self.watchlist_repo.get_by_id(watchlist_id, user_id=user_id)
        if not wl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Watchlist not found or access denied."
            )
        asset = self.asset_repo.get_by_id(asset_id)
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found."
            )

        existing = self.watchlist_repo.get_item(watchlist_id, asset_id)
        if not existing:
            item = WatchlistItem(watchlist_id=watchlist_id, asset_id=asset_id)
            self.watchlist_repo.add_item(item)

        updated_wl = self.watchlist_repo.get_by_id(watchlist_id, user_id=user_id)
        return self._format_response(updated_wl)

    def remove_asset_from_watchlist(self, watchlist_id: UUID, user_id: UUID, asset_id: UUID) -> WatchlistResponse:
        wl = self.watchlist_repo.get_by_id(watchlist_id, user_id=user_id)
        if not wl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Watchlist not found or access denied."
            )
        item = self.watchlist_repo.get_item(watchlist_id, asset_id)
        if item:
            self.watchlist_repo.remove_item(item)

        updated_wl = self.watchlist_repo.get_by_id(watchlist_id, user_id=user_id)
        return self._format_response(updated_wl)

    def _format_response(self, watchlist: Watchlist) -> WatchlistResponse:
        items = [
            WatchlistItemResponse(
                id=item.id,
                watchlist_id=item.watchlist_id,
                asset_id=item.asset_id,
                added_at=item.added_at,
                asset=item.asset
            )
            for item in (watchlist.items or [])
        ]
        return WatchlistResponse(
            id=watchlist.id,
            user_id=watchlist.user_id,
            name=watchlist.name,
            description=watchlist.description,
            created_at=watchlist.created_at,
            updated_at=watchlist.updated_at,
            items=items
        )
