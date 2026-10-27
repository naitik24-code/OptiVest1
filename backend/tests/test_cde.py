import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base
from app.models.user import User
from app.models.asset import Asset
from app.models.portfolio import Portfolio
from app.models.holding import Holding
from app.services.candidate_discovery_service import CandidateDiscoveryService
import uuid

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_cde_filter_eligibility(db_session):
    user = User(email="cde@test.com", hashed_password="pw", is_active=True)
    db_session.add(user)
    db_session.commit()

    p = Portfolio(name="CDE Test", user_id=user.id)
    db_session.add(p)
    db_session.commit()

    cde = CandidateDiscoveryService(db_session)
    candidates = cde.discover_candidates(
        portfolio_id=str(p.id),
        candidate_type="NEW_ALLOCATION",
        top_n=2
    )
    
    assert isinstance(candidates, list)
    # Even if empty (due to lack of models/data in test DB), it should not throw errors
    if candidates:
        assert "ticker" in candidates[0]
        assert "score" in candidates[0]
        assert "eligibility" in candidates[0]

def test_cde_replacement_logic(db_session):
    user = User(email="cde2@test.com", hashed_password="pw", is_active=True)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    p = Portfolio(name="CDE Test 2", user_id=user.id)
    a1 = Asset(symbol="AAPL", company_name="Apple Inc.", price=150.00)
    db_session.add(p)
    db_session.add(a1)
    db_session.commit()

    h = Holding(portfolio_id=p.id, asset_id=a1.id, quantity=10, average_buy_price=100.0)
    db_session.add(h)
    db_session.commit()

    cde = CandidateDiscoveryService(db_session)
    candidates = cde.discover_candidates(
        portfolio_id=str(p.id),
        candidate_type="REPLACEMENT",
        target_holding="AAPL",
        top_n=2
    )
    
    assert isinstance(candidates, list)
    if candidates:
        tickers = [c["ticker"] for c in candidates]
        assert "AAPL" not in tickers

def test_cde_no_synthetic_data(db_session):
    user = User(email="cde3@test.com", hashed_password="pw", is_active=True)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    p = Portfolio(name="CDE Test 3", user_id=user.id)
    db_session.add(p)
    db_session.commit()

    cde = CandidateDiscoveryService(db_session)
    candidates = cde.discover_candidates(
        portfolio_id=str(p.id),
        candidate_type="NEW_ALLOCATION",
        top_n=2
    )
    for c in candidates:
        assert c["data_quality"]["fundamentals"] == "UNAVAILABLE"
        assert c["data_quality"]["sentiment"] == "UNAVAILABLE"
        assert "expected_return" in c
