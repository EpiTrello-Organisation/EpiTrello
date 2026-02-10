"""Tests for SQLAlchemy models."""

import uuid
from datetime import UTC, datetime

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.board import Board
from app.models.board_member import BoardMember
from app.models.card import Card
from app.models.card_member import CardMember
from app.models.list import List as ListModel
from app.models.user import User


class TestUserModel:
    def test_create_user(self, db):
        user = User(
            id=uuid.uuid4(),
            email="test@example.com",
            username="testuser",
            password_hash="hashed",
        )
        db.add(user)
        db.commit()

        fetched = db.query(User).filter(User.email == "test@example.com").first()
        assert fetched is not None
        assert fetched.username == "testuser"

    def test_user_email_unique(self, db):
        uid1, uid2 = uuid.uuid4(), uuid.uuid4()
        db.add(User(id=uid1, email="dup@example.com", username="u1", password_hash="h"))
        db.commit()

        db.add(User(id=uid2, email="dup@example.com", username="u2", password_hash="h"))
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()

    def test_user_username_unique(self, db):
        uid1, uid2 = uuid.uuid4(), uuid.uuid4()
        db.add(User(id=uid1, email="a@example.com", username="same", password_hash="h"))
        db.commit()

        db.add(User(id=uid2, email="b@example.com", username="same", password_hash="h"))
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()

    def test_user_relationships(self, db, user_alice, make_board):
        board = make_board(owner=user_alice)
        assert len(user_alice.owned_boards) == 1
        assert user_alice.owned_boards[0].id == board.id

    def test_user_boards_relationship(self, db, user_alice, make_board):
        make_board(owner=user_alice)
        db.refresh(user_alice)
        assert len(user_alice.boards) == 1
        assert user_alice.boards[0].role == "owner"


class TestBoardModel:
    def test_create_board(self, db, user_alice):
        board = Board(
            id=uuid.uuid4(),
            title="Test Board",
            owner_id=user_alice.id,
            created_at=datetime.now(UTC),
        )
        db.add(board)
        db.commit()

        fetched = db.query(Board).first()
        assert fetched.title == "Test Board"
        assert fetched.owner_id == user_alice.id

    def test_board_defaults(self, db, user_alice):
        board = Board(
            id=uuid.uuid4(),
            title="Board",
            owner_id=user_alice.id,
        )
        db.add(board)
        db.commit()
        db.refresh(board)
        assert board.background_kind == "gradient"

    def test_board_owner_relationship(self, db, user_alice, make_board):
        board = make_board(owner=user_alice)
        assert board.owner.id == user_alice.id

    def test_board_cascade_members(self, db, user_alice, make_board):
        """Deleting a board should cascade delete its members."""
        board = make_board(owner=user_alice)
        board_id = board.id
        db.delete(board)
        db.commit()

        assert (
            db.query(BoardMember).filter(BoardMember.board_id == board_id).first()
            is None
        )


class TestBoardMemberModel:
    def test_create_board_member(self, db, user_alice, user_bob, make_board):
        board = make_board(owner=user_alice)
        bm = BoardMember(
            id=uuid.uuid4(),
            board_id=board.id,
            user_id=user_bob.id,
            role="member",
        )
        db.add(bm)
        db.commit()

        members = db.query(BoardMember).filter(BoardMember.board_id == board.id).all()
        assert len(members) == 2  # owner + new member

    def test_board_member_default_role(self, db, user_alice, user_bob, make_board):
        board = make_board(owner=user_alice)
        bm = BoardMember(
            id=uuid.uuid4(),
            board_id=board.id,
            user_id=user_bob.id,
        )
        db.add(bm)
        db.commit()
        db.refresh(bm)
        assert bm.role == "member"


class TestListModel:
    def test_create_list(self, db, user_alice, make_board):
        board = make_board(owner=user_alice)
        lst = ListModel(
            id=uuid.uuid4(),
            title="To Do",
            position=0,
            board_id=board.id,
        )
        db.add(lst)
        db.commit()

        fetched = db.query(ListModel).first()
        assert fetched.title == "To Do"
        assert fetched.board_id == board.id

    def test_list_board_relationship(self, db, user_alice, make_board, make_list):
        board = make_board(owner=user_alice)
        lst = make_list(board=board, title="Done", position=1)
        assert lst.board.id == board.id

    def test_board_lists_ordering(self, db, user_alice, make_board, make_list):
        board = make_board(owner=user_alice)
        make_list(board=board, title="B", position=2)
        make_list(board=board, title="A", position=1)
        db.refresh(board)
        assert [lst.title for lst in board.lists] == ["A", "B"]


class TestCardModel:
    def test_create_card(self, db, user_alice, make_board, make_list):
        board = make_board(owner=user_alice)
        lst = make_list(board=board)
        card = Card(
            id=uuid.uuid4(),
            title="My Card",
            position=0,
            list_id=lst.id,
            creator_id=user_alice.id,
            label_ids=[],
            created_at=datetime.now(UTC),
        )
        db.add(card)
        db.commit()

        fetched = db.query(Card).first()
        assert fetched.title == "My Card"
        assert fetched.creator_id == user_alice.id

    def test_card_list_relationship(
        self, db, user_alice, make_board, make_list, make_card
    ):
        board = make_board(owner=user_alice)
        lst = make_list(board=board)
        card = make_card(list_obj=lst, creator=user_alice)
        assert card.list.id == lst.id

    def test_list_cards_cascade_delete(
        self, db, user_alice, make_board, make_list, make_card
    ):
        board = make_board(owner=user_alice)
        lst = make_list(board=board)
        card = make_card(list_obj=lst, creator=user_alice)
        card_id = card.id
        db.delete(lst)
        db.commit()
        assert db.query(Card).filter(Card.id == card_id).first() is None


class TestCardMemberModel:
    def test_create_card_member(
        self, db, user_alice, user_bob, make_board, make_list, make_card
    ):
        board = make_board(owner=user_alice)
        lst = make_list(board=board)
        card = make_card(list_obj=lst, creator=user_alice)

        cm = CardMember(id=uuid.uuid4(), card_id=card.id, user_id=user_bob.id)
        db.add(cm)
        db.commit()

        assert db.query(CardMember).filter(CardMember.card_id == card.id).count() == 1

    def test_card_member_cascade_on_card_delete(
        self, db, user_alice, user_bob, make_board, make_list, make_card
    ):
        board = make_board(owner=user_alice)
        lst = make_list(board=board)
        card = make_card(list_obj=lst, creator=user_alice)
        cm = CardMember(id=uuid.uuid4(), card_id=card.id, user_id=user_bob.id)
        db.add(cm)
        db.commit()

        card_id = card.id
        db.delete(card)
        db.commit()
        assert db.query(CardMember).filter(CardMember.card_id == card_id).count() == 0

    def test_card_members_relationship(
        self, db, user_alice, user_bob, make_board, make_list, make_card
    ):
        board = make_board(owner=user_alice)
        lst = make_list(board=board)
        card = make_card(list_obj=lst, creator=user_alice)
        cm = CardMember(id=uuid.uuid4(), card_id=card.id, user_id=user_bob.id)
        db.add(cm)
        db.commit()
        db.refresh(card)
        assert len(card.members) == 1
        assert card.members[0].user_id == user_bob.id
