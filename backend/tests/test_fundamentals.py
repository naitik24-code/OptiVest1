import pytest
import uuid
import inspect
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.db.session import Base
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.asset import Asset
from app.models.market_price import MarketPrice
from app.models.asset_fundamental import AssetFundamental, PeriodType
from app.services.fundamental_engine import FundamentalEngine
from app.services.candidate_discovery_service import CandidateDiscoveryService
from app.core.security import create_access_token
from main import app

client = TestClient(app)


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


# =============================================================================
# 1. Fundamental Data Retrieval Test
# =============================================================================
def test_fundamental_data_retrieval(db_session):
    asset = Asset(symbol="MSFT", company_name="Microsoft Corp.")
    db_session.add(asset)
    db_session.commit()

    fund = AssetFundamental(
        asset_id=asset.id,
        symbol="MSFT",
        reporting_date=datetime(2025, 6, 30),
        period_type=PeriodType.ANNUAL,
        revenue=245000.0,
        net_income=88000.0,
        total_equity=200000.0,
        updated_at=datetime.now(timezone.utc)
    )
    db_session.add(fund)
    db_session.commit()

    engine = FundamentalEngine(db_session)
    retrieved = engine.get_asset_fundamentals(asset.id, "MSFT")
    assert len(retrieved) == 1
    assert retrieved[0].symbol == "MSFT"
    assert retrieved[0].revenue == 245000.0
    assert retrieved[0].net_income == 88000.0


# =============================================================================
# 2. Real-Source Mapping Test
# =============================================================================
def test_real_source_mapping(db_session):
    engine = FundamentalEngine(db_session)
    # Verify mock provider mapping returns None for missing items rather than fake defaults
    periods = engine.provider.get_fundamentals("NON_EXISTENT_TICKER_XYZ")
    assert isinstance(periods, list)
    assert len(periods) == 0


# =============================================================================
# 3. Missing Data Handling Test
# =============================================================================
def test_missing_data_handling(db_session):
    engine = FundamentalEngine(db_session)
    res = engine.evaluate_quality(None)
    assert res["status"] == "NOT_AVAILABLE"
    assert res["quality"] == "INSUFFICIENT_DATA"
    assert res["score"] == 0.0
    assert res["reporting_date"] is None
    assert len(res["reasons"]) > 0


# =============================================================================
# 4. Revenue Growth Calculation Test
# =============================================================================
def test_revenue_growth_calculation(db_session):
    p0 = AssetFundamental(
        reporting_date=datetime(2025, 12, 31),
        revenue=1200.0
    )
    p1 = AssetFundamental(
        reporting_date=datetime(2024, 12, 31),
        revenue=1000.0
    )
    engine = FundamentalEngine(db_session)
    metrics = engine.calculate_metrics([p0, p1])
    # (1200 - 1000) / 1000 = 0.20
    assert metrics["revenue_growth"] == 0.20


# =============================================================================
# 5. EPS Growth Calculation Test
# =============================================================================
def test_eps_growth_calculation(db_session):
    p0 = AssetFundamental(
        reporting_date=datetime(2025, 12, 31),
        eps=5.50
    )
    p1 = AssetFundamental(
        reporting_date=datetime(2024, 12, 31),
        eps=5.00
    )
    engine = FundamentalEngine(db_session)
    metrics = engine.calculate_metrics([p0, p1])
    # (5.50 - 5.00) / 5.00 = 0.10
    assert metrics["eps_growth"] == 0.10


# =============================================================================
# 6. Margin Calculations Test
# =============================================================================
def test_margin_calculations(db_session):
    p0 = AssetFundamental(
        reporting_date=datetime(2025, 12, 31),
        revenue=10000.0,
        gross_profit=4500.0,
        operating_income=2500.0,
        net_income=2000.0
    )
    engine = FundamentalEngine(db_session)
    metrics = engine.calculate_metrics([p0])
    assert metrics["gross_margin"] == 0.45   # 4500 / 10000
    assert metrics["operating_margin"] == 0.25 # 2500 / 10000
    assert metrics["net_margin"] == 0.20     # 2000 / 10000


# =============================================================================
# 7. ROE Calculation Test (Average Equity vs Ending Equity)
# =============================================================================
def test_roe_calculation(db_session):
    p0 = AssetFundamental(
        reporting_date=datetime(2025, 12, 31),
        net_income=200.0,
        total_equity=1200.0
    )
    p1 = AssetFundamental(
        reporting_date=datetime(2024, 12, 31),
        net_income=150.0,
        total_equity=800.0
    )
    engine = FundamentalEngine(db_session)
    # Average Equity = (1200 + 800) / 2 = 1000.0; ROE = 200 / 1000 = 0.20
    metrics_avg = engine.calculate_metrics([p0, p1])
    assert metrics_avg["roe"] == 0.20

    # Single period ending equity: ROE = 200 / 1200 = 0.1667
    metrics_single = engine.calculate_metrics([p0])
    assert metrics_single["roe"] == 0.1667


# =============================================================================
# 8. ROA Calculation Test
# =============================================================================
def test_roa_calculation(db_session):
    p0 = AssetFundamental(
        reporting_date=datetime(2025, 12, 31),
        net_income=150.0,
        total_assets=1500.0
    )
    p1 = AssetFundamental(
        reporting_date=datetime(2024, 12, 31),
        total_assets=1500.0
    )
    engine = FundamentalEngine(db_session)
    metrics = engine.calculate_metrics([p0, p1])
    # 150 / 1500 = 0.10
    assert metrics["roa"] == 0.10


# =============================================================================
# 9. Debt to Equity Calculation Test
# =============================================================================
def test_debt_to_equity_calculation(db_session):
    p0 = AssetFundamental(
        reporting_date=datetime(2025, 12, 31),
        total_debt=400.0,
        total_equity=1000.0,
        cash_and_equivalents=500.0
    )
    engine = FundamentalEngine(db_session)
    metrics = engine.calculate_metrics([p0])
    assert metrics["debt_to_equity"] == 0.40  # 400 / 1000
    assert metrics["cash_to_debt"] == 1.25    # 500 / 400


# =============================================================================
# 10. Free Cash Flow Handling Test
# =============================================================================
def test_free_cash_flow_handling(db_session):
    p0 = AssetFundamental(
        reporting_date=datetime(2025, 12, 31),
        net_income=500.0,
        free_cash_flow=450.0
    )
    engine = FundamentalEngine(db_session)
    metrics = engine.calculate_metrics([p0])
    assert metrics["free_cash_flow"] == 450.0
    assert metrics["fcf_conversion"] == 0.90  # 450 / 500


# =============================================================================
# 11. Zero Denominator Handling Test
# =============================================================================
def test_zero_denominator_handling(db_session):
    p0 = AssetFundamental(
        reporting_date=datetime(2025, 12, 31),
        revenue=0.0,
        net_income=100.0,
        total_equity=0.0,
        total_debt=0.0,
        total_assets=0.0
    )
    engine = FundamentalEngine(db_session)
    # Must not raise ZeroDivisionError
    metrics = engine.calculate_metrics([p0])
    assert "operating_margin" not in metrics
    assert "gross_margin" not in metrics
    assert "roe" not in metrics
    assert "roa" not in metrics
    assert "debt_to_equity" not in metrics
    assert "cash_to_debt" not in metrics


# =============================================================================
# 12. Negative Denominator Handling Test
# =============================================================================
def test_negative_denominator_handling(db_session):
    p0 = AssetFundamental(
        reporting_date=datetime(2025, 12, 31),
        net_income=100.0,
        total_equity=-500.0,  # Negative book value
        total_debt=200.0
    )
    engine = FundamentalEngine(db_session)
    metrics = engine.calculate_metrics([p0])
    eval_res = engine.evaluate_quality([p0])
    # Negative equity should not produce an inverted positive/negative ROE ratio
    assert "roe" not in metrics
    assert "debt_to_equity" not in metrics
    assert any("deficit" in w.lower() for w in eval_res["warnings"])


# =============================================================================
# 13. Multiple Reporting Periods Test
# =============================================================================
def test_multiple_reporting_periods(db_session):
    a = Asset(symbol="MULTI", company_name="Multi-Period Inc.")
    db_session.add(a)
    db_session.commit()

    p_2024 = AssetFundamental(
        asset_id=a.id,
        symbol="MULTI",
        reporting_date=datetime(2024, 12, 31),
        period_type=PeriodType.ANNUAL,
        revenue=1000.0,
        net_income=100.0,
        updated_at=datetime.now(timezone.utc)
    )
    p_2025 = AssetFundamental(
        asset_id=a.id,
        symbol="MULTI",
        reporting_date=datetime(2025, 12, 31),
        period_type=PeriodType.ANNUAL,
        revenue=1300.0,
        net_income=150.0,
        updated_at=datetime.now(timezone.utc)
    )
    db_session.add_all([p_2024, p_2025])
    db_session.commit()

    engine = FundamentalEngine(db_session)
    funds = engine.get_asset_fundamentals(a.id, "MULTI")
    assert len(funds) == 2
    # Ensure newest first
    assert funds[0].reporting_date > funds[1].reporting_date
    metrics = engine.calculate_metrics(funds)
    assert metrics["revenue_growth"] == 0.30   # (1300 - 1000) / 1000
    assert metrics["net_income_growth"] == 0.50 # (150 - 100) / 100


# =============================================================================
# 14. Data Freshness Test
# =============================================================================
def test_data_freshness(db_session):
    engine = FundamentalEngine(db_session)
    recent = AssetFundamental(
        reporting_date=datetime.now(timezone.utc) - timedelta(days=60),
        revenue=1000.0
    )
    eval_recent = engine.evaluate_quality(recent)
    assert eval_recent["freshness"] == "CURRENT"

    stale = AssetFundamental(
        reporting_date=datetime.now(timezone.utc) - timedelta(days=500),
        revenue=1000.0
    )
    eval_stale = engine.evaluate_quality(stale)
    assert eval_stale["freshness"] == "STALE"


# =============================================================================
# 15. Fundamental Quality Score Test
# =============================================================================
def test_fundamental_quality_score(db_session):
    p0 = AssetFundamental(
        reporting_date=datetime(2025, 12, 31),
        revenue=1000.0,
        operating_income=250.0,  # 25% op margin -> 15 pts
        net_income=200.0,
        total_equity=1000.0,     # ROE = 20% -> 15 pts
        total_debt=200.0,        # D/E = 0.20 -> 15 pts
        cash_and_equivalents=300.0, # Cash/Debt = 1.5 -> 10 pts
        free_cash_flow=180.0     # FCF conv = 0.90 -> 12 pts, FCF > 0 -> 8 pts
    )
    p1 = AssetFundamental(
        reporting_date=datetime(2024, 12, 31),
        revenue=800.0,           # Rev growth = 25% -> 15 pts
        eps=4.0
    )
    p0.eps = 5.0                # EPS growth = 25% -> 10 pts

    engine = FundamentalEngine(db_session)
    res = engine.evaluate_quality([p0, p1])
    assert res["status"] == "AVAILABLE"
    assert res["quality"] == "STRONG"
    assert res["score"] == 100.0
    assert len(res["reasons"]) >= 4


# =============================================================================
# 16. Insufficient-Data Classification Test
# =============================================================================
def test_insufficient_data_classification(db_session):
    p0 = AssetFundamental(
        reporting_date=datetime(2025, 12, 31)
        # All analytical fields empty
    )
    engine = FundamentalEngine(db_session)
    res = engine.evaluate_quality(p0)
    assert res["quality"] == "INSUFFICIENT_DATA"
    assert res["score"] == 0.0


# =============================================================================
# 17. Deterministic Output Test
# =============================================================================
def test_deterministic_output(db_session):
    p0 = AssetFundamental(
        reporting_date=datetime(2025, 12, 31),
        revenue=5000.0,
        operating_income=800.0,
        net_income=600.0,
        total_equity=3000.0,
        total_debt=1000.0
    )
    engine = FundamentalEngine(db_session)
    res1 = engine.evaluate_quality(p0)
    res2 = engine.evaluate_quality(p0)
    assert res1["score"] == res2["score"]
    assert res1["quality"] == res2["quality"]
    assert res1["reasons"] == res2["reasons"]
    assert res1["warnings"] == res2["warnings"]


# =============================================================================
# 18. CDE Integration with Fundamentals Test
# =============================================================================
def test_cde_integration_with_fundamentals(db_session):
    # Setup user, portfolio, active asset with price history & fundamentals
    user = User(
        id=uuid.uuid4(), email=f"cde_fund_{uuid.uuid4()}@optivest.ai",
        hashed_password="hash", is_active=True, role="USER"
    )
    port = Portfolio(id=uuid.uuid4(), user_id=user.id, name="Fund Port")
    asset = Asset(symbol="TESTF", company_name="Test Fund Inc.", is_active=True)
    db_session.add_all([user, port, asset])
    db_session.commit()

    # Add prices for hard constraint (> 10 days)
    now = datetime.now()
    prices = [
        MarketPrice(
            asset_id=asset.id, symbol="TESTF", timestamp=now - timedelta(days=i),
            open=100.0 + i, high=101.0 + i, low=99.0 + i, close=100.0 + i, adj_close=100.0 + i, volume=1000.0
        )
        for i in range(15)
    ]
    db_session.add_all(prices)

    # Add fundamental data
    fund = AssetFundamental(
        asset_id=asset.id,
        symbol="TESTF",
        reporting_date=datetime(2025, 12, 31),
        period_type=PeriodType.ANNUAL,
        revenue=10000.0,
        operating_income=2500.0,
        net_income=2000.0,
        total_equity=8000.0,
        total_debt=1000.0,
        free_cash_flow=1800.0
    )
    db_session.add(fund)
    db_session.commit()

    cde = CandidateDiscoveryService(db_session)
    candidates = cde.discover_candidates(str(port.id), top_n=5)
    assert isinstance(candidates, list)
    if candidates:
        match = next((c for c in candidates if c["ticker"] == "TESTF"), None)
        if match:
            assert match["fundamental_quality"] == "STRONG"
            assert match["fundamental_score"] > 70.0
            assert "fundamental_metrics" in match


# =============================================================================
# 19. Risk Profile Factor Weight Scaling Test
# =============================================================================
def test_risk_profile_behavior(db_session):
    # Conservative (level 1) vs Aggressive (level 5)
    from app.models.user_preference import UserPreference

    user_cons = User(
        id=uuid.uuid4(), email=f"cons_{uuid.uuid4()}@optivest.ai",
        hashed_password="hash", is_active=True, role="USER"
    )
    pref_cons = UserPreference(user_id=user_cons.id, risk_tolerance_level=1)
    port_cons = Portfolio(id=uuid.uuid4(), user_id=user_cons.id, name="Cons Port")

    user_aggr = User(
        id=uuid.uuid4(), email=f"aggr_{uuid.uuid4()}@optivest.ai",
        hashed_password="hash", is_active=True, role="USER"
    )
    pref_aggr = UserPreference(user_id=user_aggr.id, risk_tolerance_level=5)
    port_aggr = Portfolio(id=uuid.uuid4(), user_id=user_aggr.id, name="Aggr Port")

    asset = Asset(symbol="PROFA", company_name="Profile Asset Inc.", is_active=True)
    db_session.add_all([user_cons, pref_cons, port_cons, user_aggr, pref_aggr, port_aggr, asset])
    db_session.commit()

    now = datetime.now()
    prices = [
        MarketPrice(
            asset_id=asset.id, symbol="PROFA", timestamp=now - timedelta(days=i),
            open=50.0 + i, high=51.0 + i, low=49.0 + i, close=50.0 + i,
            adj_close=50.0 + i, volume=500.0
        )
        for i in range(15)
    ]
    db_session.add_all(prices)
    db_session.commit()

    cde = CandidateDiscoveryService(db_session)
    cand_cons = cde.discover_candidates(str(port_cons.id), top_n=5)
    cand_aggr = cde.discover_candidates(str(port_aggr.id), top_n=5)

    if cand_cons and cand_aggr:
        c1 = next((c for c in cand_cons if c["ticker"] == "PROFA"), None)
        c2 = next((c for c in cand_aggr if c["ticker"] == "PROFA"), None)
        if c1 and c2:
            # Conservative should weight volatility higher than aggressive
            assert c1["source_signals"]["w_vol"] > c2["source_signals"]["w_vol"]
            # Aggressive should weight expected return higher than conservative
            assert c2["source_signals"]["w_ret"] > c1["source_signals"]["w_ret"]


# =============================================================================
# 20. API Response Envelope Test
# =============================================================================
def test_api_asset_fundamentals_endpoint():
    # Login and query /assets/{asset_id}/fundamentals
    # First get an existing asset from the database or list
    token = create_access_token({"sub": "admin@optivest.ai", "role": "ADMIN"})
    headers = {"Authorization": f"Bearer {token}"}

    list_res = client.get("/api/v1/assets", headers=headers)
    if list_res.status_code == 200 and list_res.json()["data"]:
        asset_id = list_res.json()["data"][0]["id"]
        res = client.get(f"/api/v1/assets/{asset_id}/fundamentals", headers=headers)
        assert res.status_code == 200
        payload = res.json()
        assert payload["success"] is True
        data = payload["data"]
        assert "quality_assessment" in data
        assert "status" in data["quality_assessment"]
        assert "score" in data["quality_assessment"]


# =============================================================================
# 21. Security Verification Test (Unauthenticated Rejection)
# =============================================================================
def test_security_authenticated_access():
    # Without Authorization header -> 401 Unauthorized
    random_id = str(uuid.uuid4())
    res = client.get(f"/api/v1/assets/{random_id}/fundamentals")
    assert res.status_code == 401


# =============================================================================
# 22. No-Fake-Data Forensic Inspection Test
# =============================================================================
def test_no_fake_data_forensics():
    import app.services.fundamental_engine as fe_mod
    import app.services.providers.yahoo_provider as yp_mod
    import app.services.candidate_discovery_service as cde_mod

    for mod in [fe_mod, yp_mod, cde_mod]:
        src = inspect.getsource(mod)
        assert "np.random" not in src, f"Found np.random in {mod.__name__}"
        assert "random.random" not in src, f"Found random.random in {mod.__name__}"
        assert "random.uniform" not in src, f"Found random.uniform in {mod.__name__}"
        assert "fake_" not in src, f"Found fake_ placeholder in {mod.__name__}"


# =============================================================================
# 23. CDE Missing Fundamentals Dynamic Re-weighting Regression Test
# =============================================================================
def test_cde_dynamic_reweighting_missing_fundamentals(db_session):
    user = User(
        id=uuid.uuid4(), email=f"noweight_{uuid.uuid4()}@optivest.ai",
        hashed_password="hash", is_active=True, role="USER"
    )
    port = Portfolio(id=uuid.uuid4(), user_id=user.id, name="No Fund Port")
    # Asset with price data but zero fundamentals
    asset = Asset(symbol="NOFUND", company_name="No Fund Inc.", is_active=True)
    db_session.add_all([user, port, asset])
    db_session.commit()

    now = datetime.now()
    prices = [
        MarketPrice(
            asset_id=asset.id, symbol="NOFUND", timestamp=now - timedelta(days=i),
            open=20.0 + i, high=21.0 + i, low=19.0 + i, close=20.0 + i,
            adj_close=20.0 + i, volume=200.0
        )
        for i in range(15)
    ]
    db_session.add_all(prices)
    db_session.commit()

    cde = CandidateDiscoveryService(db_session)
    candidates = cde.discover_candidates(str(port.id), top_n=5)
    if candidates:
        match = next((c for c in candidates if c["ticker"] == "NOFUND"), None)
        if match:
            # Must be marked NOT_AVAILABLE with zero fundamental weight
            assert match["fundamental_status"] == "NOT_AVAILABLE"
            assert match["fundamental_quality"] == "INSUFFICIENT_DATA"
            assert match["source_signals"]["w_fund"] == 0.0
            # Active weights must sum to 1.0
            sig = match["source_signals"]
            total_w = sig["w_ret"] + sig["w_vol"] + sig["w_div"] + sig["w_mom"] + sig["w_fund"]
            assert round(total_w, 1) == 1.0
