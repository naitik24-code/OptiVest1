import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AssetBase(BaseModel):
    symbol: str
    company_name: str
    exchange: str = "NASDAQ"
    sector: str = "Technology"
    industry: str = "Software"
    asset_type: str = "EQUITY"
    currency: str = "USD"
    country: str = "USA"
    price: float = 100.0
    is_active: bool = True


class AssetCreate(AssetBase):
    pass


class AssetResponse(AssetBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
