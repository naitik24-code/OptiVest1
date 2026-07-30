from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.repositories.portfolio_repository import PortfolioRepository
from app.repositories.holding_repository import HoldingRepository
from app.repositories.transaction_repository import TransactionRepository
from app.repositories.asset_repository import AssetRepository
from app.repositories.watchlist_repository import WatchlistRepository
from app.services.portfolio_service import PortfolioService
from app.services.asset_service import AssetService
from app.services.watchlist_service import WatchlistService


def get_asset_repository(db: Session = Depends(get_db)) -> AssetRepository:
    return AssetRepository(db)


def get_portfolio_repository(db: Session = Depends(get_db)) -> PortfolioRepository:
    return PortfolioRepository(db)


def get_holding_repository(db: Session = Depends(get_db)) -> HoldingRepository:
    return HoldingRepository(db)


def get_transaction_repository(db: Session = Depends(get_db)) -> TransactionRepository:
    return TransactionRepository(db)


def get_watchlist_repository(db: Session = Depends(get_db)) -> WatchlistRepository:
    return WatchlistRepository(db)


def get_asset_service(
    asset_repo: AssetRepository = Depends(get_asset_repository)
) -> AssetService:
    return AssetService(asset_repo)


def get_portfolio_service(
    portfolio_repo: PortfolioRepository = Depends(get_portfolio_repository),
    holding_repo: HoldingRepository = Depends(get_holding_repository),
    transaction_repo: TransactionRepository = Depends(get_transaction_repository),
    asset_repo: AssetRepository = Depends(get_asset_repository),
) -> PortfolioService:
    return PortfolioService(portfolio_repo, holding_repo, transaction_repo, asset_repo)


def get_watchlist_service(
    watchlist_repo: WatchlistRepository = Depends(get_watchlist_repository),
    asset_repo: AssetRepository = Depends(get_asset_repository),
) -> WatchlistService:
    return WatchlistService(watchlist_repo, asset_repo)
