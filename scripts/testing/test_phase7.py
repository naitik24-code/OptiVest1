import asyncio
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.paper_trading_service import PaperTradingService
from app.models.user import User
from app.models.market_price import MarketPrice
from app.models.asset import Asset

def run_test():
    db = SessionLocal()
    try:
        print("Starting E2E Test...")
        user_id = str(uuid.uuid4())
        print(f"User ID: {user_id}")
        
        svc = PaperTradingService(db)
        
        # 1. Wallet creation
        wallet = svc.get_or_create_wallet(user_id=user_id)
        print(f"Wallet Created: {wallet.id}")
        
        # Prepare mock Market Prices
        asset1 = db.query(Asset).filter(Asset.symbol == "AAPL").first()
        if not asset1:
            asset1 = Asset(id=uuid.uuid4(), symbol="AAPL", company_name="Apple Inc.", asset_type="EQUITY", sector="Technology")
            db.add(asset1)
            
        asset2 = db.query(Asset).filter(Asset.symbol == "NVDA").first()
        if not asset2:
            asset2 = Asset(id=uuid.uuid4(), symbol="NVDA", company_name="NVIDIA Corp.", asset_type="EQUITY", sector="Technology")
            db.add(asset2)
            
        db.commit()

        aapl_price = MarketPrice(id=uuid.uuid4(), asset_id=asset1.id, symbol="AAPL", timestamp=datetime.utcnow(), open=150.0, high=150.0, low=150.0, close=150.0, adj_close=150.0, volume=100.0)
        nvda_price = MarketPrice(id=uuid.uuid4(), asset_id=asset2.id, symbol="NVDA", timestamp=datetime.utcnow(), open=200.0, high=200.0, low=200.0, close=200.0, adj_close=200.0, volume=100.0)
        db.add(aapl_price)
        db.add(nvda_price)
        db.commit()
        
        # 2. Add AAPL / NVDA - Execute BUY
        res1 = svc.place_virtual_order(wallet.id, "AAPL", "BUY", 10.0, 150.0)
        print(f"BUY AAPL: {res1}")
        
        res2 = svc.place_virtual_order(wallet.id, "NVDA", "BUY", 5.0, 200.0)
        print(f"BUY NVDA: {res2}")
        
        # 3. Execute SELL
        res3 = svc.place_virtual_order(wallet.id, "AAPL", "SELL", 5.0, 150.0)
        print(f"SELL AAPL (Partial): {res3}")
        
        # 4. Dashboard
        dash = svc.get_dashboard_summary(user_id)
        print(f"Dashboard Value: {dash['portfolio_value']}")
        
        # 5. APDE recommendation
        from app.models.apde import DecisionCard
        card = DecisionCard(id=str(uuid.uuid4()), portfolio_id=wallet.id, title="Swap AAPL for NVDA",
                            recommendation_type="REALLOCATE",
                            source_asset="AAPL", target_asset="NVDA", capital_amount=500.0,
                            expected_return_improvement=0.05, confidence_score=0.9, model_used="AI", market_regime="BULL",
                            why_this_stock="Good", why_not_another="Bad", why_now="Today", why_this_percentage="10%")
        db.add(card)
        db.commit()
        
        res4 = svc.execute_apde_recommendation(wallet.id, card.id)
        print(f"APDE Execute: {res4}")
        
        # 6. Analytics
        analytics = svc.generate_research_report(user_id)
        print(f"Analytics: {analytics}")
        
        # 7. Replay
        dash2 = svc.get_dashboard_summary(user_id)
        decision_id = dash2['recent_decisions'][0]['id'] if dash2['recent_decisions'] else None
        if decision_id:
            replay = svc.replay_decision(decision_id, user_id)
            print(f"Replay success for {decision_id}")
            
        print("ALL END-TO-END TESTS COMPLETED SUCCESSFULLY!")
    except Exception as e:
        print(f"E2E TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
