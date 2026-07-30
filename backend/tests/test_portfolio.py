import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base
from app.models.user import User
from app.models.asset import Asset
from app.models.portfolio import Portfolio
from app.models.holding import Holding
from app.repositories.asset_repository import AssetRepository
from app.repositories.portfolio_repository import PortfolioRepository
from app.repositories.holding_repository import HoldingRepository
from app.repositories.transaction_repository import TransactionRepository
from app.services.portfolio_service import PortfolioService
from app.services.portfolio_calculation_engine import PortfolioCalculationEngine
from app.schemas.portfolio import PortfolioCreate
from app.schemas.holding import HoldingCreate
from app.schemas.transaction import TransactionCreate


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_portfolio_service_crud_and_calculations(db_session):
    # 1. Create User
    user = User(email="test@optivest.ai", hashed_password="hashed_pw", is_active=True)
    db_session.add(user)
    db_session.commit()

    # 2. Create Asset
    asset_repo = AssetRepository(db_session)
    asset = Asset(symbol="AAPL", company_name="Apple Inc.", price=150.00)
    asset_repo.create(asset)

    # 3. Create Portfolio Service
    portfolio_repo = PortfolioRepository(db_session)
    holding_repo = HoldingRepository(db_session)
    tx_repo = TransactionRepository(db_session)
    service = PortfolioService(portfolio_repo, holding_repo, tx_repo, asset_repo)

    # 4. Create Portfolio
    p_req = PortfolioCreate(name="Core Portfolio", description="Primary vault", is_default=True)
    portfolio_resp = service.create_portfolio(user.id, p_req)
    assert portfolio_resp.name == "Core Portfolio"
    assert portfolio_resp.is_default is True

    # 5. Add Holding (BUY 10 AAPL @ $100)
    h_req = HoldingCreate(portfolio_id=portfolio_resp.id, asset_id=asset.id, quantity=10, average_buy_price=100.00)
    p_after_holding = service.add_or_update_holding(user.id, h_req)

    # Verify calculation engine
    assert len(p_after_holding.holdings) == 1
    h = p_after_holding.holdings[0]
    assert h.book_value == 1000.00
    assert h.market_value == 1500.00  # 10 shares * $150 current asset price
    assert h.unrealized_pnl == 500.00
    assert h.unrealized_pnl_pct == 50.00

    # 6. Record BUY Transaction (BUY 10 more AAPL @ $200)
    tx_req = TransactionCreate(
        portfolio_id=portfolio_resp.id,
        asset_id=asset.id,
        transaction_type="BUY",
        quantity=10,
        price=200.00,
        fees=0.0
    )
    service.record_transaction(user.id, tx_req)

    p_final = service.get_portfolio_by_id(portfolio_resp.id, user.id)
    assert len(p_final.holdings) == 1
    h_final = p_final.holdings[0]
    assert h_final.quantity == 20
    assert h_final.average_buy_price == 150.00  # (10*100 + 10*200) / 20 = 150
    assert h_final.book_value == 3000.00
    assert h_final.market_value == 3000.00  # 20 shares * $150
    assert h_final.unrealized_pnl == 0.0
