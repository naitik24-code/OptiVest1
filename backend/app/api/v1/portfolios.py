from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate, PortfolioResponse
from app.schemas.holding import HoldingCreate
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.schemas.common import ResponseEnvelope, MessagePayload
from app.services.portfolio_service import PortfolioService
from app.dependencies.portfolio_deps import get_portfolio_service
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/portfolios", tags=["Portfolios"])


@router.get("", response_model=ResponseEnvelope[List[PortfolioResponse]])
def list_portfolios(
    portfolio_service: PortfolioService = Depends(get_portfolio_service),
    current_user: User = Depends(get_current_user)
):
    portfolios = portfolio_service.list_portfolios_by_user(current_user.id)
    return ResponseEnvelope.success_response(portfolios)


@router.post("", response_model=ResponseEnvelope[PortfolioResponse], status_code=status.HTTP_201_CREATED)
def create_portfolio(
    req: PortfolioCreate,
    portfolio_service: PortfolioService = Depends(get_portfolio_service),
    current_user: User = Depends(get_current_user)
):
    portfolio = portfolio_service.create_portfolio(current_user.id, req)
    return ResponseEnvelope.success_response(portfolio)


@router.get("/{portfolio_id}", response_model=ResponseEnvelope[PortfolioResponse])
def get_portfolio(
    portfolio_id: UUID,
    portfolio_service: PortfolioService = Depends(get_portfolio_service),
    current_user: User = Depends(get_current_user)
):
    portfolio = portfolio_service.get_portfolio_by_id(portfolio_id, current_user.id)
    return ResponseEnvelope.success_response(portfolio)


@router.put("/{portfolio_id}", response_model=ResponseEnvelope[PortfolioResponse])
def update_portfolio(
    portfolio_id: UUID,
    req: PortfolioUpdate,
    portfolio_service: PortfolioService = Depends(get_portfolio_service),
    current_user: User = Depends(get_current_user)
):
    portfolio = portfolio_service.update_portfolio(portfolio_id, current_user.id, req)
    return ResponseEnvelope.success_response(portfolio)


@router.delete("/{portfolio_id}", response_model=ResponseEnvelope[MessagePayload])
def delete_portfolio(
    portfolio_id: UUID,
    portfolio_service: PortfolioService = Depends(get_portfolio_service),
    current_user: User = Depends(get_current_user)
):
    portfolio_service.delete_portfolio(portfolio_id, current_user.id)
    return ResponseEnvelope.success_response(MessagePayload(message="Portfolio deleted successfully."))


@router.post("/holdings", response_model=ResponseEnvelope[PortfolioResponse])
def add_or_update_holding(
    req: HoldingCreate,
    portfolio_service: PortfolioService = Depends(get_portfolio_service),
    current_user: User = Depends(get_current_user)
):
    portfolio = portfolio_service.add_or_update_holding(current_user.id, req)
    return ResponseEnvelope.success_response(portfolio)


@router.delete("/holdings/{holding_id}", response_model=ResponseEnvelope[PortfolioResponse])
def delete_holding(
    holding_id: UUID,
    portfolio_service: PortfolioService = Depends(get_portfolio_service),
    current_user: User = Depends(get_current_user)
):
    portfolio = portfolio_service.delete_holding(holding_id, current_user.id)
    return ResponseEnvelope.success_response(portfolio)


@router.post("/transactions", response_model=ResponseEnvelope[TransactionResponse], status_code=status.HTTP_201_CREATED)
def record_transaction(
    req: TransactionCreate,
    portfolio_service: PortfolioService = Depends(get_portfolio_service),
    current_user: User = Depends(get_current_user)
):
    tx = portfolio_service.record_transaction(current_user.id, req)
    return ResponseEnvelope.success_response(tx)


@router.get("/{portfolio_id}/candidates", response_model=ResponseEnvelope[List[dict]])
def get_portfolio_candidates(
    portfolio_id: UUID,
    candidate_type: str = "NEW_ALLOCATION",
    target_holding: str = None,
    limit: int = 5,
    portfolio_service: PortfolioService = Depends(get_portfolio_service),
    current_user: User = Depends(get_current_user)
):
    from app.services.candidate_discovery_service import CandidateDiscoveryService
    
    # Authorize ownership implicitly through portfolio_service
    portfolio = portfolio_service.get_portfolio_by_id(portfolio_id, current_user.id)
    
    # Run CDE
    cde = CandidateDiscoveryService(portfolio_service.repo.db)
    candidates = cde.discover_candidates(
        portfolio_id=str(portfolio.id),
        candidate_type=candidate_type,
        target_holding=target_holding,
        top_n=limit
    )
    
    return ResponseEnvelope.success_response(candidates)


@router.get("/{portfolio_id}/transactions", response_model=ResponseEnvelope[List[TransactionResponse]])
def list_portfolio_transactions(
    portfolio_id: UUID,
    skip: int = 0,
    limit: int = 50,
    transaction_type: str | None = None,
    portfolio_service: PortfolioService = Depends(get_portfolio_service),
    current_user: User = Depends(get_current_user)
):
    txs = portfolio_service.list_portfolio_transactions(
        portfolio_id=portfolio_id,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        transaction_type=transaction_type
    )
    return ResponseEnvelope.success_response(txs)

