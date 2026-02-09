"""
Shared fixtures for the test suite.

Uses an in-memory SQLite database so no external Postgres is required.
Every test function gets a fresh DB and a fresh FastAPI TestClient.
"""

import json
import uuid
from datetime import datetime

import pytest
from sqlalchemy import create_engine, event, String, Text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.dialects.postgresql import ARRAY

from app.core.database import Base
from app.core.security import hash_password
from app.models.user import User
from app.models.board import Board
from app.models.board_member import BoardMember
from app.models.list import List as ListModel
from app.models.card import Card
from app.models.card_member import CardMember

from sqlalchemy.ext.compiler import compiles
from sqlalchemy.types import TypeDecorator


class JSONEncodedList(TypeDecorator):
    """Stores a Python list as a JSON-encoded TEXT column (SQLite compat)."""
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return []
        return json.loads(value)


class SQLiteUUID(TypeDecorator):
    """Stores UUID as a 32-char hex string in SQLite, returns uuid.UUID."""
    impl = String(32)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value.hex
        # Accept string representations too
        return uuid.UUID(str(value)).hex

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)


@compiles(ARRAY, "sqlite")
def _compile_array_sqlite(type_, compiler, **kw):
    return "TEXT"


_orig_label_ids = Card.__table__.c.label_ids
_orig_label_ids.type = JSONEncodedList()

from sqlalchemy.dialects.postgresql import UUID as PG_UUID
for table in Base.metadata.tables.values():
    for col in table.columns:
        if isinstance(col.type, PG_UUID):
            col.type = SQLiteUUID()

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, _connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def db():
    """Yield a fresh DB session; tables are created/dropped per test."""
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db):
    """FastAPI TestClient with overridden DB dependency."""
    from fastapi.testclient import TestClient

    from app.api.deps import get_db
    from app.main import app

    from app.api import auth as auth_module

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[auth_module.get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture()
def make_user(db):
    """Factory fixture to quickly create a persisted User."""

    def _make(email="alice@example.com", username="alice", password="secret123"):
        user = User(
            id=uuid.uuid4(),
            email=email,
            username=username,
            password_hash=hash_password(password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    return _make


@pytest.fixture()
def user_alice(make_user):
    return make_user(email="alice@example.com", username="alice")


@pytest.fixture()
def user_bob(make_user):
    return make_user(email="bob@example.com", username="bob")


@pytest.fixture()
def make_board(db):
    """Factory fixture to create a Board + owner BoardMember."""

    def _make(owner: User, title="My Board", **kwargs):
        board = Board(
            id=uuid.uuid4(),
            title=title,
            owner_id=owner.id,
            background_kind=kwargs.get("background_kind", "gradient"),
            background_value=kwargs.get("background_value"),
            background_thumb_url=kwargs.get("background_thumb_url"),
            created_at=datetime.utcnow(),
        )
        db.add(board)
        db.flush()

        bm = BoardMember(
            id=uuid.uuid4(),
            board_id=board.id,
            user_id=owner.id,
            role="owner",
        )
        db.add(bm)
        db.commit()
        db.refresh(board)
        return board

    return _make


@pytest.fixture()
def make_list(db):
    """Factory fixture to create a List on a given board."""

    def _make(board: Board, title="To Do", position=0):
        lst = ListModel(
            id=uuid.uuid4(),
            title=title,
            position=position,
            board_id=board.id,
        )
        db.add(lst)
        db.commit()
        db.refresh(lst)
        return lst

    return _make


@pytest.fixture()
def make_card(db):
    """Factory fixture to create a Card on a given list."""

    def _make(list_obj, creator: User, title="Card 1", position=0, description=None, label_ids=None):
        card = Card(
            id=uuid.uuid4(),
            title=title,
            description=description,
            position=position,
            list_id=list_obj.id,
            creator_id=creator.id,
            label_ids=label_ids if label_ids is not None else [],
            created_at=datetime.utcnow(),
        )
        db.add(card)
        db.commit()
        db.refresh(card)
        return card

    return _make


def auth_header(token: str) -> dict:
    """Return Authorization header dict."""
    return {"Authorization": f"Bearer {token}"}


def register_and_login(client, email="alice@example.com", username="alice", password="secret123"):
    """Register a user via the API and return (user_data, token, headers)."""
    resp = client.post(
        "/api/auth/register",
        json={"email": email, "username": username, "password": password},
    )
    assert resp.status_code == 200, resp.text

    resp_login = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert resp_login.status_code == 200, resp_login.text
    token = resp_login.json()["access_token"]
    return resp.json(), token, auth_header(token)
