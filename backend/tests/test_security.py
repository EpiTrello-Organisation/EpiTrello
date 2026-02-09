"""Tests for core security helpers (hashing, JWT)."""

from datetime import datetime, timedelta
from unittest.mock import patch

from jose import jwt

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password


class TestPasswordHashing:
    def test_hash_password_returns_string(self):
        h = hash_password("mypassword")
        assert isinstance(h, str)
        assert h != "mypassword"

    def test_verify_password_correct(self):
        h = hash_password("mypassword")
        assert verify_password("mypassword", h) is True

    def test_verify_password_wrong(self):
        h = hash_password("mypassword")
        assert verify_password("wrongpassword", h) is False

    def test_different_hashes_for_same_password(self):
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2


class TestJWT:
    def test_create_access_token_returns_string(self):
        token = create_access_token("user-123")
        assert isinstance(token, str)

    def test_access_token_contains_sub(self):
        token = create_access_token("user-123")
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        assert payload["sub"] == "user-123"

    def test_access_token_contains_exp(self):
        token = create_access_token("user-123")
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        assert "exp" in payload

    def test_access_token_expires_in_future(self):
        token = create_access_token("user-123")
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        exp = datetime.utcfromtimestamp(payload["exp"])
        assert exp > datetime.utcnow()

    def test_decode_with_wrong_secret_fails(self):
        token = create_access_token("user-123")
        try:
            jwt.decode(token, "wrong-secret", algorithms=[settings.JWT_ALGORITHM])
            assert False, "Should have raised"
        except Exception:
            pass
