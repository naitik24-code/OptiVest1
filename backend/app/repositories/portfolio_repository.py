from uuid import UUID
from typing import Optional, List, Union
from sqlalchemy.orm import Session, joinedload
from app.models.portfolio import Portfolio
from app.models.holding import Holding


class PortfolioRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, portfolio_id: Union[UUID, str], user_id: Optional[Union[UUID, str]] = None) -> Optional[Portfolio]:
        if isinstance(portfolio_id, str):
            try:
                portfolio_id = UUID(portfolio_id)
            except (ValueError, TypeError):
                return None
        
        query = (
            self.db.query(Portfolio)
            .options(
                joinedload(Portfolio.holdings).joinedload(Holding.asset),
                joinedload(Portfolio.transactions)
            )
            .filter(Portfolio.id == portfolio_id)
        )
        if user_id:
            if isinstance(user_id, str):
                user_id = UUID(user_id)
            query = query.filter(Portfolio.user_id == user_id)
            
        return query.first()

    def list_by_user(self, user_id: Union[UUID, str]) -> List[Portfolio]:
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        return (
            self.db.query(Portfolio)
            .options(joinedload(Portfolio.holdings).joinedload(Holding.asset))
            .filter(Portfolio.user_id == user_id)
            .order_by(Portfolio.is_default.desc(), Portfolio.created_at.asc())
            .all()
        )

    def get_default_portfolio(self, user_id: Union[UUID, str]) -> Optional[Portfolio]:
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        return (
            self.db.query(Portfolio)
            .options(joinedload(Portfolio.holdings).joinedload(Holding.asset))
            .filter(Portfolio.user_id == user_id, Portfolio.is_default.is_(True))
            .first()
        )

    def create(self, portfolio: Portfolio) -> Portfolio:
        if portfolio.is_default:
            # Clear previous defaults for user
            self.db.query(Portfolio).filter(
                Portfolio.user_id == portfolio.user_id,
                Portfolio.is_default.is_(True)
            ).update({"is_default": False})

        self.db.add(portfolio)
        self.db.commit()
        self.db.refresh(portfolio)
        return portfolio

    def update(self, portfolio: Portfolio) -> Portfolio:
        if portfolio.is_default:
            self.db.query(Portfolio).filter(
                Portfolio.user_id == portfolio.user_id,
                Portfolio.id != portfolio.id,
                Portfolio.is_default.is_(True)
            ).update({"is_default": False})

        self.db.add(portfolio)
        self.db.commit()
        self.db.refresh(portfolio)
        return portfolio

    def delete(self, portfolio: Portfolio) -> None:
        self.db.delete(portfolio)
        self.db.commit()
