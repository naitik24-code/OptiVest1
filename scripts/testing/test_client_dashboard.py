import sys
import os
import unittest.mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Mocks
sys.modules['torch'] = unittest.mock.Mock()
sys.modules['torch.nn'] = unittest.mock.Mock()
sys.modules['joblib'] = unittest.mock.Mock()
sys.modules['sklearn'] = unittest.mock.Mock()
sys.modules['sklearn.ensemble'] = unittest.mock.Mock()
sys.modules['xgboost'] = unittest.mock.Mock()
sys.modules['scipy'] = unittest.mock.Mock()
sys.modules['scipy.optimize'] = unittest.mock.Mock()

from fastapi.testclient import TestClient
from main import app
from app.db.session import SessionLocal
from app.models.user import User
from app.dependencies.auth import create_access_token

def test_dashboard():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "test2@example.com").first()
    if not user:
        print("User not found")
        return
    
    token = create_access_token(data={"sub": user.id})
    headers = {"Authorization": f"Bearer {token}"}
    
    client = TestClient(app)
    
    try:
        response = client.get("/api/v1/paper-trading/dashboard", headers=headers)
        print("Status code:", response.status_code)
        print("Response:", response.text)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_dashboard()
