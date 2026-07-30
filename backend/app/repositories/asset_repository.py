from uuid import UUID
from typing import Optional, List, Union
from sqlalchemy.orm import Session
from app.models.asset import Asset


class AssetRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, asset_id: Union[UUID, str]) -> Optional[Asset]:
        if isinstance(asset_id, str):
            try:
                asset_id = UUID(asset_id)
            except (ValueError, TypeError):
                return None
        return self.db.query(Asset).filter(Asset.id == asset_id).first()

    def get_by_symbol(self, symbol: str) -> Optional[Asset]:
        return self.db.query(Asset).filter(Asset.symbol == symbol.upper()).first()

    def list_all(self, active_only: bool = True) -> List[Asset]:
        query = self.db.query(Asset)
        if active_only:
            query = query.filter(Asset.is_active.is_(True))
        return query.order_by(Asset.symbol.asc()).all()

    def search(self, query_str: str) -> List[Asset]:
        q = f"%{query_str.lower()}%"
        return (
            self.db.query(Asset)
            .filter((Asset.symbol.ilike(q)) | (Asset.company_name.ilike(q)))
            .filter(Asset.is_active.is_(True))
            .limit(20)
            .all()
        )

    def create(self, asset: Asset) -> Asset:
        self.db.add(asset)
        self.db.commit()
        self.db.refresh(asset)
        return asset
