from uuid import UUID
from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.models.portfolio import Portfolio
from app.models.holding import Holding
from app.models.transaction import Transaction
from app.repositories.portfolio_repository import PortfolioRepository
from app.repositories.holding_repository import HoldingRepository
from app.repositories.transaction_repository import TransactionRepository
from app.repositories.asset_repository import AssetRepository
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate, PortfolioResponse
from app.schemas.holding import HoldingCreate
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.services.portfolio_calculation_engine import PortfolioCalculationEngine


class PortfolioService:
    def __init__(
        self,
        portfolio_repo: PortfolioRepository,
        holding_repo: HoldingRepository,
        transaction_repo: TransactionRepository,
        asset_repo: AssetRepository
    ):
        self.portfolio_repo = portfolio_repo
        self.holding_repo = holding_repo
        self.transaction_repo = transaction_repo
        self.asset_repo = asset_repo

    def get_portfolio_by_id(self, portfolio_id: UUID, user_id: UUID) -> PortfolioResponse:
        portfolio = self.portfolio_repo.get_by_id(portfolio_id, user_id=user_id)
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found or access denied."
            )
        
        calc_result = PortfolioCalculationEngine.calculate_portfolio_metrics(portfolio)
        recent_txs = self.transaction_repo.list_by_portfolio(portfolio.id, limit=10)

        tx_dtos = [
            TransactionResponse(
                id=tx.id,
                portfolio_id=tx.portfolio_id,
                asset_id=tx.asset_id,
                transaction_type=tx.transaction_type,
                quantity=tx.quantity,
                price=tx.price,
                fees=tx.fees,
                total_amount=round((tx.quantity * tx.price) + tx.fees, 2),
                notes=tx.notes,
                timestamp=tx.timestamp,
                created_at=tx.created_at,
                asset=tx.asset
            )
            for tx in recent_txs
        ]

        return PortfolioResponse(
            id=portfolio.id,
            user_id=portfolio.user_id,
            name=portfolio.name,
            description=portfolio.description,
            currency=portfolio.currency,
            is_default=portfolio.is_default,
            created_at=portfolio.created_at,
            updated_at=portfolio.updated_at,
            metrics=calc_result["metrics"],
            holdings=calc_result["calculated_holdings"],
            recent_transactions=tx_dtos
        )

    def list_portfolios_by_user(self, user_id: UUID) -> List[PortfolioResponse]:
        portfolios = self.portfolio_repo.list_by_user(user_id)
        
        # If user has no portfolios, auto-create default 'Primary Portfolio'
        if not portfolios:
            default_p = Portfolio(
                user_id=user_id,
                name="Primary Investment Portfolio",
                description="Default Core Portfolio",
                currency="USD",
                is_default=True
            )
            created_p = self.portfolio_repo.create(default_p)
            portfolios = [created_p]

        results: List[PortfolioResponse] = []
        for p in portfolios:
            calc_result = PortfolioCalculationEngine.calculate_portfolio_metrics(p)
            results.append(
                PortfolioResponse(
                    id=p.id,
                    user_id=p.user_id,
                    name=p.name,
                    description=p.description,
                    currency=p.currency,
                    is_default=p.is_default,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                    metrics=calc_result["metrics"],
                    holdings=calc_result["calculated_holdings"],
                    recent_transactions=[]
                )
            )
        return results

    def create_portfolio(self, user_id: UUID, req: PortfolioCreate) -> PortfolioResponse:
        existing = self.portfolio_repo.list_by_user(user_id)
        is_first = len(existing) == 0

        portfolio = Portfolio(
            user_id=user_id,
            name=req.name,
            description=req.description,
            currency=req.currency,
            is_default=req.is_default or is_first
        )
        created = self.portfolio_repo.create(portfolio)
        return self.get_portfolio_by_id(created.id, user_id)

    def update_portfolio(self, portfolio_id: UUID, user_id: UUID, req: PortfolioUpdate) -> PortfolioResponse:
        portfolio = self.portfolio_repo.get_by_id(portfolio_id, user_id=user_id)
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found or access denied."
            )

        if req.name is not None:
            portfolio.name = req.name
        if req.description is not None:
            portfolio.description = req.description
        if req.currency is not None:
            portfolio.currency = req.currency
        if req.is_default is not None:
            portfolio.is_default = req.is_default

        updated = self.portfolio_repo.update(portfolio)
        return self.get_portfolio_by_id(updated.id, user_id)

    def delete_portfolio(self, portfolio_id: UUID, user_id: UUID) -> None:
        portfolio = self.portfolio_repo.get_by_id(portfolio_id, user_id=user_id)
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found or access denied."
            )
        self.portfolio_repo.delete(portfolio)

    def add_or_update_holding(self, user_id: UUID, req: HoldingCreate) -> PortfolioResponse:
        portfolio = self.portfolio_repo.get_by_id(req.portfolio_id, user_id=user_id)
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found or access denied."
            )

        asset = self.asset_repo.get_by_id(req.asset_id)
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found."
            )

        holding = self.holding_repo.get_by_portfolio_and_asset(req.portfolio_id, req.asset_id)
        if holding:
            # Weighted average buy price calculation
            total_qty = holding.quantity + req.quantity
            total_cost = (holding.quantity * holding.average_buy_price) + (req.quantity * req.average_buy_price)
            holding.quantity = total_qty
            holding.average_buy_price = round(total_cost / total_qty, 2) if total_qty > 0 else 0.0
            self.holding_repo.save(holding)
        else:
            holding = Holding(
                portfolio_id=req.portfolio_id,
                asset_id=req.asset_id,
                quantity=req.quantity,
                average_buy_price=req.average_buy_price
            )
            self.holding_repo.save(holding)

        # Record corresponding BUY Transaction
        tx = Transaction(
            portfolio_id=req.portfolio_id,
            asset_id=req.asset_id,
            transaction_type="BUY",
            quantity=req.quantity,
            price=req.average_buy_price,
            fees=0.0,
            notes="Manual holding addition"
        )
        self.transaction_repo.create(tx)

        return self.get_portfolio_by_id(req.portfolio_id, user_id)

    def delete_holding(self, holding_id: UUID, user_id: UUID) -> PortfolioResponse:
        holding = self.holding_repo.get_by_id(holding_id)
        if not holding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Holding not found."
            )

        portfolio = self.portfolio_repo.get_by_id(holding.portfolio_id, user_id=user_id)
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied."
            )

        pid = holding.portfolio_id
        self.holding_repo.delete(holding)
        return self.get_portfolio_by_id(pid, user_id)

    def record_transaction(self, user_id: UUID, req: TransactionCreate) -> TransactionResponse:
        portfolio = self.portfolio_repo.get_by_id(req.portfolio_id, user_id=user_id)
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found or access denied."
            )

        asset = self.asset_repo.get_by_id(req.asset_id)
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found."
            )

        # Update holdings based on transaction type
        holding = self.holding_repo.get_by_portfolio_and_asset(req.portfolio_id, req.asset_id)

        if req.transaction_type == "BUY":
            if holding:
                new_qty = holding.quantity + req.quantity
                new_cost = (holding.quantity * holding.average_buy_price) + (req.quantity * req.price)
                holding.quantity = new_qty
                holding.average_buy_price = round(new_cost / new_qty, 2) if new_qty > 0 else 0.0
                self.holding_repo.save(holding)
            else:
                holding = Holding(
                    portfolio_id=req.portfolio_id,
                    asset_id=req.asset_id,
                    quantity=req.quantity,
                    average_buy_price=req.price
                )
                self.holding_repo.save(holding)

        elif req.transaction_type == "SELL":
            if not holding or holding.quantity < req.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient holdings to sell {req.quantity} shares."
                )
            holding.quantity -= req.quantity
            if holding.quantity <= 0:
                self.holding_repo.delete(holding)
            else:
                self.holding_repo.save(holding)

        tx = Transaction(
            portfolio_id=req.portfolio_id,
            asset_id=req.asset_id,
            transaction_type=req.transaction_type,
            quantity=req.quantity,
            price=req.price,
            fees=req.fees,
            notes=req.notes,
            timestamp=req.timestamp or datetime.now(timezone.utc)
        )
        created_tx = self.transaction_repo.create(tx)

        return TransactionResponse(
            id=created_tx.id,
            portfolio_id=created_tx.portfolio_id,
            asset_id=created_tx.asset_id,
            transaction_type=created_tx.transaction_type,
            quantity=created_tx.quantity,
            price=created_tx.price,
            fees=created_tx.fees,
            total_amount=round((created_tx.quantity * created_tx.price) + created_tx.fees, 2),
            notes=created_tx.notes,
            timestamp=created_tx.timestamp,
            created_at=created_tx.created_at,
            asset=asset
        )

    def list_portfolio_transactions(
        self,
        portfolio_id: UUID,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50,
        transaction_type: str | None = None
    ) -> List[TransactionResponse]:
        portfolio = self.portfolio_repo.get_by_id(portfolio_id, user_id=user_id)
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found or access denied."
            )

        txs = self.transaction_repo.list_by_portfolio(
            portfolio_id=portfolio_id,
            skip=skip,
            limit=limit,
            transaction_type=transaction_type
        )

        return [
            TransactionResponse(
                id=tx.id,
                portfolio_id=tx.portfolio_id,
                asset_id=tx.asset_id,
                transaction_type=tx.transaction_type,
                quantity=tx.quantity,
                price=tx.price,
                fees=tx.fees,
                total_amount=round((tx.quantity * tx.price) + tx.fees, 2),
                notes=tx.notes,
                timestamp=tx.timestamp,
                created_at=tx.created_at,
                asset=tx.asset
            )
            for tx in txs
        ]

