import requests

def main():
    base_url = "http://127.0.0.1:8001/api/v1"
    
    # 1. Login
    response = requests.post(f"{base_url}/auth/login", json={"email": "test2@example.com", "password": "Password123!"})
    if response.status_code != 200:
        print(f"Login failed: {response.status_code} {response.text}")
        return

    token = response.json().get("data", {}).get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    dashboard_resp = requests.get(f"{base_url}/paper-trading/dashboard", headers=headers)
    print(dashboard_resp.status_code)
    print(dashboard_resp.text)

if __name__ == "__main__":
    main()
