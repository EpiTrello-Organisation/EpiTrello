"""Tests for /api/users endpoints."""

from tests.conftest import register_and_login


class TestUsersMe:
    def test_get_me_success(self, client):
        user_data, token, headers = register_and_login(client)
        resp = client.get("/api/users/me", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "alice@example.com"
        assert data["username"] == "alice"
        assert data["id"] == user_data["id"]

    def test_get_me_no_token(self, client):
        resp = client.get("/api/users/me")
        assert resp.status_code in (401, 403)

    def test_get_me_invalid_token(self, client):
        resp = client.get("/api/users/me", headers={"Authorization": "Bearer invalidtoken"})
        assert resp.status_code == 401
