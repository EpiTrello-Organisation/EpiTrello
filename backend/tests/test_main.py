"""Tests for the root endpoint and app setup."""


class TestRootEndpoint:
    def test_root(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["message"] == "Welcome to the Trello Clone API!"
