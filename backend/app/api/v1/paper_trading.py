"""
Phase 7 — Enterprise Paper Trading Platform API Endpoints
Provides RESTful APIs for paper wallet, virtual orders, AI execution,
replay, dashboard, and research analytics.
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.paper_trading_service import PaperTradingService
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.paper_trading import PaperWallet

router = APIRouter(prefix="/paper-trading", tags=["Paper Trading Platform"])


def _verify_wallet_ownership(wallet_id: str, current_user: User, db: Session):
    wallet = db.query(PaperWallet).filter(PaperWallet.id == wallet_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Paper wallet not found")
    if str(wallet.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this paper wallet")
    return wallet


@router.get("/wallet")
def get_paper_wallet(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieves or creates paper trading wallet."""
    service = PaperTradingService(db)
    wallet = service.get_or_create_wallet(current_user.id)
    return {
        "id": wallet.id,
        "user_id": wallet.user_id,
        "wallet_name": wallet.wallet_name,
        "cash_balance": wallet.cash_balance,
        "invested_capital": wallet.invested_capital,
        "buying_power": wallet.buying_power,
        "total_portfolio_value": wallet.total_portfolio_value,
        "total_realized_pl": wallet.total_realized_pl,
        "total_unrealized_pl": wallet.total_unrealized_pl,
        "currency": wallet.currency,
    }


@router.post("/orders")
def place_virtual_order(
    wallet_id: str,
    symbol: str,
    side: str, # BUY, SELL, PARTIAL_SELL
    quantity: float,
    price: float,
    order_type: str = "MARKET",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Executes a virtual buy/sell paper order."""
    _verify_wallet_ownership(wallet_id, current_user, db)
    service = PaperTradingService(db)
    res = service.place_virtual_order(wallet_id, symbol, side, quantity, price, order_type)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res


@router.post("/execute-recommendation/{card_id}")
def execute_apde_recommendation(
    card_id: str,
    wallet_id: str = Query(..., description="Target Paper Wallet ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Converts an accepted APDE recommendation into virtual executed paper orders."""
    _verify_wallet_ownership(wallet_id, current_user, db)
    service = PaperTradingService(db)
    res = service.execute_apde_recommendation(wallet_id, card_id)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res


@router.get("/dashboard")
def get_paper_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieves complete Paper Trading Dashboard analytics and metrics."""
    service = PaperTradingService(db)
    return service.get_dashboard_summary(current_user.id)


@router.get("/replay/{decision_id}")
def replay_decision(decision_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Replays decision execution lifecycle from recommendation to outcome."""
    # Note: For strict security we could verify that the decision belongs to a wallet owned by current_user.
    service = PaperTradingService(db)
    return service.replay_decision(decision_id, current_user.id)


@router.get("/research-analytics")
def get_research_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Generates dissertation-grade research performance report for APDE decisions."""
    service = PaperTradingService(db)
    return service.generate_research_report(current_user.id)
