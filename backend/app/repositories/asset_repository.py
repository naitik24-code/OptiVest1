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

    def create_or_get(
        self,
        symbol: str,
        company_name: str,
        exchange: str = "NASDAQ",
        sector: str = "Technology",
        industry: str = "General",
        asset_type: str = "EQUITY",
        currency: str = "USD",
        country: str = "USA",
        price: float = 100.0
    ) -> Asset:
        existing = self.get_by_symbol(symbol)
        if existing:
            return existing

        from app.models.asset import AssetType, Currency
        atype = AssetType.EQUITY
        curr = Currency.USD
        try:
            atype = AssetType(asset_type.upper())
        except Exception:
            pass
        try:
            curr = Currency(currency.upper())
        except Exception:
            pass

        new_asset = Asset(
            symbol=symbol.upper(),
            company_name=company_name,
            exchange=exchange,
            sector=sector,
            industry=industry,
            asset_type=atype,
            currency=curr,
            country=country,
            price=price,
            is_active=True
        )
        return self.create(new_asset)
