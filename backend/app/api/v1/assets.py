from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from app.schemas.asset import AssetResponse, AssetFundamentalsResponse
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


@router.get("/{asset_id}/fundamentals", response_model=ResponseEnvelope[AssetFundamentalsResponse])
def get_asset_fundamentals(
    asset_id: UUID,
    asset_service: AssetService = Depends(get_asset_service),
    current_user: User = Depends(get_current_user)
):
    from app.services.fundamental_engine import FundamentalEngine
    asset = asset_service.get_asset_by_id(asset_id)
    if not asset:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found")

    f_engine = FundamentalEngine(asset_service.repo.db)
    periods = f_engine.get_asset_fundamentals(asset.id, asset.symbol, getattr(asset, "exchange", None))
    assessment = f_engine.evaluate_quality(periods)

    raw_statement = None
    if periods:
        p0 = periods[0]
        raw_statement = {
            "reporting_period": p0.reporting_date.isoformat(),
            "period_type": p0.period_type,
            "revenue": p0.revenue,
            "gross_profit": p0.gross_profit,
            "operating_income": p0.operating_income,
            "net_income": p0.net_income,
            "eps": p0.eps,
            "total_assets": p0.total_assets,
            "total_liabilities": p0.total_liabilities,
            "total_debt": p0.total_debt,
            "total_equity": p0.total_equity,
            "cash_and_equivalents": p0.cash_and_equivalents,
            "operating_cash_flow": p0.operating_cash_flow,
            "capital_expenditure": p0.capital_expenditure,
            "free_cash_flow": p0.free_cash_flow,
            "shares_outstanding": p0.shares_outstanding,
            "historical_periods_available": len(periods)
        }

    result = AssetFundamentalsResponse(
        asset_id=str(asset.id),
        symbol=asset.symbol,
        company_name=asset.company_name,
        data_source="Yahoo Finance (Audited Statements)",
        quality_assessment=assessment,
        raw_statement_metrics=raw_statement
    )
    return ResponseEnvelope.success_response(result)

