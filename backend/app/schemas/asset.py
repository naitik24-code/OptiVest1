import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
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




class AssetResponse(AssetBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FundamentalQualityAssessment(BaseModel):
    status: str
    score: float
    quality: str
    freshness: str
    reporting_date: Optional[str] = None
    metrics: Dict[str, Any] = {}
    dimension_scores: Dict[str, Any] = {}
    reasons: List[str] = []
    warnings: List[str] = []


class AssetFundamentalsResponse(BaseModel):
    asset_id: str
    symbol: str
    company_name: Optional[str] = None
    data_source: str = "Yahoo Finance (Audited Statements)"
    quality_assessment: FundamentalQualityAssessment
    raw_statement_metrics: Optional[Dict[str, Any]] = None

