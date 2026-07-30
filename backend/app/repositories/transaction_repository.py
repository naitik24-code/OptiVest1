from uuid import UUID
from typing import Optional, List, Union
from sqlalchemy.orm import Session, joinedload
from app.models.transaction import Transaction


class TransactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, transaction_id: Union[UUID, str]) -> Optional[Transaction]:
        if isinstance(transaction_id, str):
            try:
                transaction_id = UUID(transaction_id)
            except (ValueError, TypeError):
                return None
        return (
            self.db.query(Transaction)
            .options(joinedload(Transaction.asset))
            .filter(Transaction.id == transaction_id)
            .first()
        )

    def list_by_portfolio(self, portfolio_id: Union[UUID, str], limit: int = 50) -> List[Transaction]:
        if isinstance(portfolio_id, str):
            portfolio_id = UUID(portfolio_id)
        return (
            self.db.query(Transaction)
            .options(joinedload(Transaction.asset))
            .filter(Transaction.portfolio_id == portfolio_id)
            .order_by(Transaction.timestamp.desc())
            .limit(limit)
            .all()
        )

    def create(self, transaction: Transaction) -> Transaction:
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction
