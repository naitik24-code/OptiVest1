import uuid
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.asset import AssetResponse


class TransactionBase(BaseModel):
    portfolio_id: uuid.UUID
    asset_id: uuid.UUID
    transaction_type: Literal["BUY", "SELL", "DIVIDEND", "FEE"]
    quantity: float = Field(..., ge=0)
    price: float = Field(..., ge=0)
    fees: float = Field(0.0, ge=0)
    notes: str | None = None
    timestamp: datetime | None = None


class TransactionCreate(TransactionBase):
    pass


class TransactionResponse(BaseModel):
    id: uuid.UUID
    portfolio_id: uuid.UUID
    asset_id: uuid.UUID
    transaction_type: str
    quantity: float
    price: float
    fees: float
    total_amount: float
    notes: str | None = None
    timestamp: datetime
    created_at: datetime
    asset: AssetResponse | None = None

    model_config = ConfigDict(from_attributes=True)
