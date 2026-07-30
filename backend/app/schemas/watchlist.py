import uuid
from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict
from app.schemas.asset import AssetResponse


class WatchlistItemResponse(BaseModel):
    id: uuid.UUID
    watchlist_id: uuid.UUID
    asset_id: uuid.UUID
    added_at: datetime
    asset: AssetResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class WatchlistBase(BaseModel):
    name: str
    description: str | None = None


class WatchlistCreate(WatchlistBase):
    pass


class WatchlistUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class WatchlistResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime
    items: List[WatchlistItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class AddWatchlistItemRequest(BaseModel):
    asset_id: uuid.UUID
