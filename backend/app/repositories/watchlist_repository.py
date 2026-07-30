from uuid import UUID
from typing import Optional, List, Union
from sqlalchemy.orm import Session, joinedload
from app.models.watchlist import Watchlist, WatchlistItem


class WatchlistRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, watchlist_id: Union[UUID, str], user_id: Optional[Union[UUID, str]] = None) -> Optional[Watchlist]:
        if isinstance(watchlist_id, str):
            try:
                watchlist_id = UUID(watchlist_id)
            except (ValueError, TypeError):
                return None

        query = (
            self.db.query(Watchlist)
            .options(joinedload(Watchlist.items).joinedload(WatchlistItem.asset))
            .filter(Watchlist.id == watchlist_id)
        )
        if user_id:
            if isinstance(user_id, str):
                user_id = UUID(user_id)
            query = query.filter(Watchlist.user_id == user_id)
        return query.first()

    def list_by_user(self, user_id: Union[UUID, str]) -> List[Watchlist]:
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        return (
            self.db.query(Watchlist)
            .options(joinedload(Watchlist.items).joinedload(WatchlistItem.asset))
            .filter(Watchlist.user_id == user_id)
            .order_by(Watchlist.created_at.asc())
            .all()
        )

    def create(self, watchlist: Watchlist) -> Watchlist:
        self.db.add(watchlist)
        self.db.commit()
        self.db.refresh(watchlist)
        return watchlist

    def update(self, watchlist: Watchlist) -> Watchlist:
        self.db.add(watchlist)
        self.db.commit()
        self.db.refresh(watchlist)
        return watchlist

    def delete(self, watchlist: Watchlist) -> None:
        self.db.delete(watchlist)
        self.db.commit()

    def add_item(self, item: WatchlistItem) -> WatchlistItem:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def remove_item(self, item: WatchlistItem) -> None:
        self.db.delete(item)
        self.db.commit()

    def get_item(self, watchlist_id: Union[UUID, str], asset_id: Union[UUID, str]) -> Optional[WatchlistItem]:
        if isinstance(watchlist_id, str):
            watchlist_id = UUID(watchlist_id)
        if isinstance(asset_id, str):
            asset_id = UUID(asset_id)
        return (
            self.db.query(WatchlistItem)
            .filter(WatchlistItem.watchlist_id == watchlist_id, WatchlistItem.asset_id == asset_id)
            .first()
        )
