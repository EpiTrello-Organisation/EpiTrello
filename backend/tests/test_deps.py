"""Tests for the deps module (dependency functions)."""

import uuid

import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock, patch
from fastapi.security import HTTPAuthorizationCredentials

from app.api.deps import get_current_user, get_board_member, require_board_owner
from app.core.security import create_access_token
from app.models.user import User
from app.models.board import Board
from app.models.board_member import BoardMember


class TestGetCurrentUser:
    def test_valid_token(self, db, user_alice):
        token = create_access_token(str(user_alice.id))
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        result = get_current_user(credentials=credentials, db=db)
        assert result.id == user_alice.id

    def test_invalid_token(self, db):
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="badtoken")

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials=credentials, db=db)
        assert exc_info.value.status_code == 401

    def test_token_with_no_sub(self, db):
        from jose import jwt
        from app.core.config import settings

        token = jwt.encode({"foo": "bar"}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials=credentials, db=db)
        assert exc_info.value.status_code == 401

    def test_token_user_not_found(self, db):
        fake_id = str(uuid.uuid4())
        token = create_access_token(fake_id)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials=credentials, db=db)
        assert exc_info.value.status_code == 401


class TestGetBoardMember:
    def test_is_member(self, db, user_alice, make_board):
        board = make_board(owner=user_alice)
        result = get_board_member(board_id=board.id, db=db, current_user=user_alice)
        assert result.user_id == user_alice.id

    def test_not_member(self, db, user_alice, user_bob, make_board):
        board = make_board(owner=user_alice)
        with pytest.raises(HTTPException) as exc_info:
            get_board_member(board_id=board.id, db=db, current_user=user_bob)
        assert exc_info.value.status_code == 403


class TestRequireBoardOwner:
    def test_is_owner(self, db, user_alice, make_board):
        board = make_board(owner=user_alice)
        result = require_board_owner(board_id=board.id, db=db, current_user=user_alice)
        assert result.role == "owner"

    def test_member_but_not_owner(self, db, user_alice, user_bob, make_board):
        board = make_board(owner=user_alice)
        bm = BoardMember(id=uuid.uuid4(), board_id=board.id, user_id=user_bob.id, role="member")
        db.add(bm)
        db.commit()

        with pytest.raises(HTTPException) as exc_info:
            require_board_owner(board_id=board.id, db=db, current_user=user_bob)
        assert exc_info.value.status_code == 403

    def test_not_member_at_all(self, db, user_alice, user_bob, make_board):
        board = make_board(owner=user_alice)
        with pytest.raises(HTTPException) as exc_info:
            require_board_owner(board_id=board.id, db=db, current_user=user_bob)
        assert exc_info.value.status_code == 403
