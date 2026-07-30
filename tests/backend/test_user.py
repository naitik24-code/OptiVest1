import pytest

def get_auth_token(client, email="profile_user@optivest.ai"):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123!"
        }
    )
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "Password123!"
        }
    )
    return res.json()["data"]["access_token"]


def test_get_current_user_me(client):
    token = get_auth_token(client, "me_test@optivest.ai")
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "me_test@optivest.ai"


def test_get_and_update_profile(client):
    token = get_auth_token(client, "profile_update@optivest.ai")
    
    # 1. Fetch Profile
    response = client.get(
        "/api/v1/users/profile",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["preference"]["max_reallocation_pct"] == 15.0

    # 2. Update Profile
    update_res = client.put(
        "/api/v1/users/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "max_reallocation_pct": 25.0,
            "risk_tolerance_level": 5,
            "investment_goal": "Aggressive Growth"
        }
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()["data"]
    assert updated_data["preference"]["max_reallocation_pct"] == 25.0
    assert updated_data["preference"]["risk_tolerance_level"] == 5
    assert updated_data["preference"]["investment_goal"] == "Aggressive Growth"
