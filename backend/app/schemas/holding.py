import uuid
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.asset import AssetResponse


class HoldingBase(BaseModel):
    asset_id: uuid.UUID
    quantity: float = Field(..., gt=0, description="Quantity must be greater than 0")
    average_buy_price: float = Field(..., ge=0, description="Average buy price must be non-negative")


class HoldingCreate(HoldingBase):
    portfolio_id: uuid.UUID


class HoldingUpdate(BaseModel):
    quantity: float = Field(..., gt=0)
    average_buy_price: float = Field(..., ge=0)


class HoldingResponse(BaseModel):
    id: uuid.UUID
    portfolio_id: uuid.UUID
    asset_id: uuid.UUID
    quantity: float
    average_buy_price: float
    book_value: float
    market_value: float
    unrealized_pnl: float
    unrealized_pnl_pct: float
    created_at: datetime
    updated_at: datetime
    asset: AssetResponse | None = None

    model_config = ConfigDict(from_attributes=True)
