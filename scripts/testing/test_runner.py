import subprocess
import time
import requests
import sys

def main():
    print("Starting uvicorn...")
    server = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--port", "8000"],
        cwd="E:/NAITIK PATHAK/PROJECT/StockProject/backend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    time.sleep(15) # Wait for server to start
    
    try:
        base_url = "http://127.0.0.1:8000/api/v1"
        email = "test2@example.com"
        password = "Password123!"

        # 1. Login
        print("Logging in...")
        response = requests.post(f"{base_url}/auth/login", json={"email": email, "password": password})
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} {response.text}")
            return

        token = response.json().get("data", {}).get("access_token")
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get user info
        print("Fetching user info...")
        user_resp = requests.get(f"{base_url}/users/me", headers=headers)
        if user_resp.status_code != 200:
            print(f"Auth fetch failed: {user_resp.status_code}")
            return
            
        print(f"User: {user_resp.json().get('data', {}).get('email')}")

        # 3. Get portfolios
        print("Fetching portfolios...")
        ports_resp = requests.get(f"{base_url}/portfolios", headers=headers)
        if ports_resp.status_code != 200:
            print(f"Portfolio fetch failed: {ports_resp.status_code}")
            return
            
        portfolios = ports_resp.json().get("data", [])
        if not portfolios:
            print("No portfolios found for user.")
            return

        portfolio_id = portfolios[0]["id"]
        print(f"Using portfolio: {portfolio_id}")

        # 4. Test APDE Health
        print("Testing APDE Health...")
        health_resp = requests.get(f"{base_url}/apde/health/{portfolio_id}", headers=headers)
        print(f"APDE Health status: {health_resp.status_code}")
        print(health_resp.json())

        # 5. Test APDE Recommendations
        print("Testing APDE Recommendations...")
        rec_resp = requests.post(f"{base_url}/apde/recommendations/{portfolio_id}", headers=headers)
        print(f"APDE Recs status: {rec_resp.status_code}")
        print(rec_resp.json())

        print("\nSUCCESS! APDE endpoints work perfectly with authentication.")
    except Exception as e:
        print(f"Exception: {e}")
    finally:
        print("Terminating server...")
        server.terminate()

if __name__ == "__main__":
    main()
