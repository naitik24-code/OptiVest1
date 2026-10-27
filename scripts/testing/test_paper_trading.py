import os
import sys
import uuid

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.db.session import Base
from app.models.user import User
from app.models.paper_trading import PaperWallet, PaperOrder, PaperPosition, PaperDecision
from app.models.market_price import MarketPrice
from app.services.paper_trading_service import PaperTradingService

DB_URL = "sqlite:///./test_paper.db"
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def test_paper_trading():
    print("Testing Paper Trading...")
    user = User(id=uuid.uuid4(), email="test@example.com", hashed_password="pw", is_active=True)
    db.add(user)
    db.commit()
    
    mp = MarketPrice(id=uuid.uuid4(), asset_id=uuid.uuid4(), symbol="AAPL", timestamp=__import__('datetime').datetime.now(__import__('datetime').timezone.utc), open=150, high=155, low=149, close=152.0, adj_close=152)
    db.add(mp)
    db.commit()

    # Delete existing wallet to start fresh
    existing_wallet = db.query(PaperWallet).filter(PaperWallet.user_id == user.id).first()
    if existing_wallet:
        db.delete(existing_wallet)
        db.commit()

    service = PaperTradingService(db)
    
    # TEST 1: Create Wallet
    print("\n--- TEST 1: Create Wallet ---")
    wallet = service.get_or_create_wallet(str(user.id))
    print(f"Created wallet: {wallet.id}, Balance: ${wallet.cash_balance}")
    assert wallet.cash_balance == 100000.0

    # Ensure some market price exists
    latest_price = db.query(MarketPrice).first()
    if not latest_price:
        print("No market price data available to test.")
        return

    symbol = latest_price.symbol
    price = latest_price.close

    # TEST 2: Buy Order
    print(f"\n--- TEST 2: Real Market Price BUY {symbol} ---")
    qty = 10.0
    res = service.place_virtual_order(wallet.id, symbol, "BUY", qty, price)
    print(res)
    assert res.get("status") == "FILLED"
    assert res.get("executed_price") == price
    
    # Reload wallet and positions
    db.refresh(wallet)
    pos = db.query(PaperPosition).filter(PaperPosition.wallet_id == wallet.id, PaperPosition.symbol == symbol).first()
    print(f"Post-buy cash: {wallet.cash_balance}, Position qty: {pos.quantity if pos else 0}")

    # TEST 3: Partial Sell Order
    print(f"\n--- TEST 3: Partial Sell Order {symbol} ---")
    res2 = service.place_virtual_order(wallet.id, symbol, "SELL", 5.0, price)
    print(res2)
    assert res2.get("status") == "FILLED"
    
    db.refresh(wallet)
    pos = db.query(PaperPosition).filter(PaperPosition.wallet_id == wallet.id, PaperPosition.symbol == symbol).first()
    print(f"Post-sell cash: {wallet.cash_balance}, Remaining Position qty: {pos.quantity if pos else 0}")
    
    # TEST 4: Invalid Market Price
    print(f"\n--- TEST 4: Invalid Market Price ---")
    res_inv = service.place_virtual_order(wallet.id, "INVALID_TICKER", "BUY", 1.0, 100.0)
    print(res_inv)
    assert "MARKET_DATA_UNAVAILABLE" in res_inv.get("error", "")

    # TEST 5: Limit Order Pending
    print(f"\n--- TEST 5: Limit Order Pending ---")
    res_limit = service.place_virtual_order(wallet.id, symbol, "BUY", 1.0, price - 10.0, "LIMIT")
    print(res_limit)
    assert res_limit.get("status") == "PENDING"

    print("\n✅ All Tests Passed successfully.")

if __name__ == "__main__":
    test_paper_trading()
