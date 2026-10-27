import uuid
import pytest
from app.db.session import SessionLocal
from app.services.apde_engine import APDEEngine
from app.models.portfolio import Portfolio
from app.models.holding import Holding
from app.models.user import User
from app.models.user_preference import UserPreference

def test_apde_e2e_real_engine():
    db = SessionLocal()
    try:
        # Check if we can get a portfolio
        portfolios = db.query(Portfolio).limit(1).all()
        if not portfolios:
            print("No portfolios available to test.")
            return

        portfolio_id = str(portfolios[0].id)
        
        # Test 1: Calculate Portfolio Health
        engine = APDEEngine(db)
        health = engine.calculate_portfolio_health(portfolio_id)
        assert "health_score" in health
        print(f"Health Score: {health['health_score']}")
        print(f"Portfolio Return: {health['expected_return_annual']}")
        print(f"Portfolio Risk: {health['portfolio_volatility']}")
        
        # Test 2: Generate Recommendations (Optimization)
        cards = engine.generate_recommendations(portfolio_id, "5D")
        print(f"Cards generated: {len(cards)}")
        for c in cards:
            print(f"Reallocation: {c['source_asset']} -> {c['target_asset']} ({c['reallocation_pct']})")
            
        # Test 3: What-If Simulator
        if health["asset_allocations"]:
            source = list(health["asset_allocations"].keys())[0]
            target = "SPY"
            sim = engine.run_what_if_simulation(portfolio_id, source, target, 0.05)
            assert "simulated_return" in sim
            print(f"Simulation Return Delta: {sim['return_delta']}")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_apde_e2e_real_engine()
    print("Test Complete.")
