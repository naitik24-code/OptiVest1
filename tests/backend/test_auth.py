import pytest

def test_register_user_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test_investor@optivest.ai",
            "password": "Password123!"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "test_investor@optivest.ai"
    assert "id" in data["data"]


def test_register_duplicate_email_fails(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test_duplicate@optivest.ai",
            "password": "Password123!"
        }
    )
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test_duplicate@optivest.ai",
            "password": "Password123!"
        }
    )
    assert response.status_code == 409
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "RESOURCE_CONFLICT"


def test_login_success(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test_login@optivest.ai",
            "password": "Password123!"
        }
    )
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test_login@optivest.ai",
            "password": "Password123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]


def test_login_invalid_password_fails(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test_wrong_pass@optivest.ai",
            "password": "Password123!"
        }
    )
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test_wrong_pass@optivest.ai",
            "password": "WrongPassword!"
        }
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "AUTHENTICATION_FAILED"
