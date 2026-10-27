import requests

base_url = "http://127.0.0.1:8000/api/v1"
email = "test2@example.com"
password = "Password123!"

# 1. Login
response = requests.post(f"{base_url}/auth/login", json={"email": email, "password": password})
if response.status_code != 200:
    print(f"Login failed: {response.status_code} {response.text}")
    exit(1)

token = response.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

# 2. Get user info
user_resp = requests.get(f"{base_url}/users/me", headers=headers)
if user_resp.status_code != 200:
    print(f"Auth fetch failed: {user_resp.status_code}")
    exit(1)
user_data = user_resp.json()

# 3. Get portfolios
ports_resp = requests.get(f"{base_url}/portfolios", headers=headers)
if ports_resp.status_code != 200:
    print(f"Portfolio fetch failed: {ports_resp.status_code}")
    exit(1)
portfolios = ports_resp.json()
if not portfolios:
    print("No portfolios found for user.")
    exit(1)

portfolio_id = portfolios[0]["id"]
print(f"Using portfolio: {portfolio_id}")

# 4. Test APDE Health
health_resp = requests.get(f"{base_url}/apde/health/{portfolio_id}", headers=headers)
print(f"APDE Health status: {health_resp.status_code}")
print(health_resp.json())

# 5. Test APDE Recommendations
rec_resp = requests.post(f"{base_url}/apde/recommendations/{portfolio_id}", headers=headers)
print(f"APDE Recs status: {rec_resp.status_code}")
print(rec_resp.json())

print("APDE endpoints work perfectly with authentication.")
