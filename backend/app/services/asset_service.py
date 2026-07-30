from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from app.models.asset import Asset
from app.repositories.asset_repository import AssetRepository
from app.schemas.asset import AssetCreate


class AssetService:
    def __init__(self, asset_repo: AssetRepository):
        self.asset_repo = asset_repo

    def list_assets(self) -> List[Asset]:
        return self.asset_repo.list_all()

    def search_assets(self, query: str) -> List[Asset]:
        if not query or len(query.strip()) < 1:
            return self.asset_repo.list_all()[:20]
        return self.asset_repo.search(query)

    def get_asset_by_id(self, asset_id: UUID) -> Asset:
        asset = self.asset_repo.get_by_id(asset_id)
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found."
            )
        return asset

    def seed_initial_assets(self) -> None:
        """Seed sample master assets if table is empty."""
        existing = self.asset_repo.list_all()
        if existing:
            return

        sample_assets = [
            # US Equities
            Asset(symbol="AAPL", company_name="Apple Inc.", exchange="NASDAQ", sector="Technology", industry="Consumer Electronics", price=182.52),
            Asset(symbol="MSFT", company_name="Microsoft Corp.", exchange="NASDAQ", sector="Technology", industry="Software", price=410.34),
            Asset(symbol="GOOGL", company_name="Alphabet Inc.", exchange="NASDAQ", sector="Technology", industry="Internet Services", price=145.20),
            Asset(symbol="AMZN", company_name="Amazon.com Inc.", exchange="NASDAQ", sector="Consumer Cyclical", industry="Internet Retail", price=174.50),
            Asset(symbol="TSLA", company_name="Tesla Inc.", exchange="NASDAQ", sector="Consumer Cyclical", industry="Auto Manufacturers", price=197.40),
            Asset(symbol="NVDA", company_name="NVIDIA Corporation", exchange="NASDAQ", sector="Technology", industry="Semiconductors", price=788.17),
            # Indian Equities
            Asset(symbol="RELIANCE", company_name="Reliance Industries Ltd.", exchange="NSE", sector="Energy", industry="Oil & Gas", currency="INR", country="India", price=2950.00),
            Asset(symbol="TCS", company_name="Tata Consultancy Services", exchange="NSE", sector="Technology", industry="IT Services", currency="INR", country="India", price=4120.00),
            Asset(symbol="INFY", company_name="Infosys Limited", exchange="NSE", sector="Technology", industry="IT Services", currency="INR", country="India", price=1665.00),
            Asset(symbol="HDFCBANK", company_name="HDFC Bank Limited", exchange="NSE", sector="Financial Services", industry="Banking", currency="INR", country="India", price=1440.00),
            Asset(symbol="ICICIBANK", company_name="ICICI Bank Limited", exchange="NSE", sector="Financial Services", industry="Banking", currency="INR", country="India", price=1085.00),
            Asset(symbol="SBIN", company_name="State Bank of India", exchange="NSE", sector="Financial Services", industry="Banking", currency="INR", country="India", price=760.00),
        ]

        for asset in sample_assets:
            self.asset_repo.create(asset)
