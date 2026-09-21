import asyncio
import uuid
import sys
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.portfolio import Portfolio
from app.models.holding import Holding
from app.models.asset import Asset
from app.models.user import User
from app.models.user_preference import UserPreference
from app.services.apde_engine import APDEEngine
from app.core.security import get_password_hash

def run_apde_audit():
    db: Session = SessionLocal()
    try:
        # Create a test user
        user = User(
            id=uuid.uuid4(),
            email=f"apde_audit_user_{uuid.uuid4().hex[:8]}@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            role="investor"
        )
        db.add(user)
        
        # Test 1: Conservative Investor
        prof1 = UserPreference(
            user_id=user.id,
            risk_tolerance_level=1,
            investment_goal="Preservation",
            preferred_currency="USD"
        )
        db.add(prof1)
        
        p1 = Portfolio(
            id=uuid.uuid4(),
            user_id=user.id,
            name="Conservative Portfolio",
            currency="USD"
        )
        db.add(p1)
        
        # We need assets
        a1 = db.query(Asset).filter(Asset.symbol == "AAPL").first()
        a2 = db.query(Asset).filter(Asset.symbol == "MSFT").first()
        if not a1 or not a2:
            print("Missing assets. Seeding...")
            from app.services.asset_service import AssetService
            from app.repositories.asset_repository import AssetRepository
            AssetService(AssetRepository(db)).seed_initial_assets()
            a1 = db.query(Asset).filter(Asset.symbol == "AAPL").first()
            a2 = db.query(Asset).filter(Asset.symbol == "MSFT").first()
            
        h1 = Holding(portfolio_id=p1.id, asset_id=a1.id, quantity=10, average_buy_price=100.0)
        h2 = Holding(portfolio_id=p1.id, asset_id=a2.id, quantity=15, average_buy_price=200.0)
        db.add(h1)
        db.add(h2)
        db.commit()

        print(f"Testing Conservative Portfolio {p1.id}")
        engine = APDEEngine(db)
        recs = engine.generate_recommendations(str(p1.id))
        
        for r in recs:
            print(f"  -> {r['recommendation_type']} {r['target_asset']}: {r['reasoning']}")

        # Rollback all changes
        db.rollback()
        
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_apde_audit()
