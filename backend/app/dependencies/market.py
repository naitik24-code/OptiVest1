from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.repositories.market_repository import MarketRepository
from app.repositories.asset_repository import AssetRepository
from app.repositories.portfolio_repository import PortfolioRepository
from app.services.market_service import MarketService


def get_market_repository(db: Session = Depends(get_db)) -> MarketRepository:
    return MarketRepository(db)


def get_market_service(
    db: Session = Depends(get_db),
    market_repo: MarketRepository = Depends(get_market_repository)
) -> MarketService:
    asset_repo = AssetRepository(db)
    portfolio_repo = PortfolioRepository(db)
    return MarketService(market_repo, asset_repo, portfolio_repo)
