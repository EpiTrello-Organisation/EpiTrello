"""Tests for /api/auth endpoints (register + login)."""

import pytest
from tests.conftest import auth_header, register_and_login


class TestRegister:
    def test_register_success(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"email": "new@example.com", "username": "newuser", "password": "pass1234"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "new@example.com"
        assert data["username"] == "newuser"
        assert "id" in data
        assert "password" not in data
        assert "password_hash" not in data

    def test_register_duplicate_email(self, client):
        client.post(
            "/api/auth/register",
            json={"email": "dup@example.com", "username": "u1", "password": "pass"},
        )
        resp = client.post(
            "/api/auth/register",
            json={"email": "dup@example.com", "username": "u2", "password": "pass"},
        )
        assert resp.status_code == 400
        assert "already used" in resp.json()["detail"].lower()

    def test_register_invalid_email(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"email": "not-an-email", "username": "u", "password": "pass"},
        )
        assert resp.status_code == 422

    def test_register_missing_fields(self, client):
        resp = client.post("/api/auth/register", json={"email": "a@b.com"})
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client):
        client.post(
            "/api/auth/register",
            json={"email": "log@example.com", "username": "log", "password": "pass"},
        )
        resp = client.post(
            "/api/auth/login",
            json={"email": "log@example.com", "password": "pass"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        client.post(
            "/api/auth/register",
            json={"email": "wp@example.com", "username": "wp", "password": "correct"},
        )
        resp = client.post(
            "/api/auth/login",
            json={"email": "wp@example.com", "password": "wrong"},
        )
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client):
        resp = client.post(
            "/api/auth/login",
            json={"email": "nobody@example.com", "password": "x"},
        )
        assert resp.status_code == 401

    def test_login_missing_fields(self, client):
        resp = client.post("/api/auth/login", json={})
        assert resp.status_code == 422
