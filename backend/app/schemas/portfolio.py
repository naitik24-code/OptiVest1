import uuid
from datetime import datetime
from typing import List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.holding import HoldingResponse
from app.schemas.transaction import TransactionResponse


class PortfolioBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    currency: str = "USD"
    is_default: bool = False


class PortfolioCreate(PortfolioBase):
    pass


class PortfolioUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    currency: str | None = None
    is_default: bool | None = None


class PortfolioSummaryMetrics(BaseModel):
    portfolio_value: float = 0.0
    total_invested: float = 0.0
    book_value: float = 0.0
    market_value: float = 0.0
    profit_loss: float = 0.0
    profit_loss_pct: float = 0.0
    cash_balance: float = 0.0
    holdings_count: int = 0
    assets_count: int = 0
    portfolio_return_pct: float = 0.0


class PortfolioResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: str | None = None
    currency: str
    is_default: bool
    created_at: datetime
    updated_at: datetime
    metrics: PortfolioSummaryMetrics | None = None
    holdings: List[HoldingResponse] = []
    recent_transactions: List[TransactionResponse] = []

    model_config = ConfigDict(from_attributes=True)
