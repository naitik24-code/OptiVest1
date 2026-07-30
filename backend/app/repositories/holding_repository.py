from uuid import UUID
from typing import Optional, List, Union
from sqlalchemy.orm import Session, joinedload
from app.models.holding import Holding


class HoldingRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, holding_id: Union[UUID, str]) -> Optional[Holding]:
        if isinstance(holding_id, str):
            try:
                holding_id = UUID(holding_id)
            except (ValueError, TypeError):
                return None
        return (
            self.db.query(Holding)
            .options(joinedload(Holding.asset))
            .filter(Holding.id == holding_id)
            .first()
        )

    def get_by_portfolio_and_asset(self, portfolio_id: Union[UUID, str], asset_id: Union[UUID, str]) -> Optional[Holding]:
        if isinstance(portfolio_id, str):
            portfolio_id = UUID(portfolio_id)
        if isinstance(asset_id, str):
            asset_id = UUID(asset_id)
        return (
            self.db.query(Holding)
            .options(joinedload(Holding.asset))
            .filter(Holding.portfolio_id == portfolio_id, Holding.asset_id == asset_id)
            .first()
        )

    def list_by_portfolio(self, portfolio_id: Union[UUID, str]) -> List[Holding]:
        if isinstance(portfolio_id, str):
            portfolio_id = UUID(portfolio_id)
        return (
            self.db.query(Holding)
            .options(joinedload(Holding.asset))
            .filter(Holding.portfolio_id == portfolio_id)
            .all()
        )

    def save(self, holding: Holding) -> Holding:
        self.db.add(holding)
        self.db.commit()
        self.db.refresh(holding)
        return holding

    def delete(self, holding: Holding) -> None:
        self.db.delete(holding)
        self.db.commit()
