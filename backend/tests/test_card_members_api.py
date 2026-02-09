"""Tests for /api/cards/{card_id}/members endpoints."""

import uuid
from tests.conftest import register_and_login


def _setup_board_list_card(client, headers):
    """Create board + list + card, return (board_id, list_id, card_id)."""
    board_resp = client.post("/api/boards/", json={"title": "Board"}, headers=headers)
    board_id = board_resp.json()["id"]

    list_resp = client.post(f"/api/lists/?board_id={board_id}", json={"title": "List"}, headers=headers)
    list_id = list_resp.json()["id"]

    card_resp = client.post(f"/api/cards/?list_id={list_id}", json={"title": "Card"}, headers=headers)
    card_id = card_resp.json()["id"]

    return board_id, list_id, card_id


class TestListCardMembers:
    def test_list_card_members_empty(self, client):
        _, _, headers = register_and_login(client)
        _, _, card_id = _setup_board_list_card(client, headers)

        resp = client.get(f"/api/cards/{card_id}/members/", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_card_members_after_add(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        board_id, _, card_id = _setup_board_list_card(client, headers_alice)

        register_and_login(client, email="bob@example.com", username="bob")
        client.post(
            f"/api/boards/{board_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )

        client.post(
            f"/api/cards/{card_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )

        resp = client.get(f"/api/cards/{card_id}/members/", headers=headers_alice)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["email"] == "bob@example.com"


class TestAddCardMember:
    def test_add_card_member_success(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        board_id, _, card_id = _setup_board_list_card(client, headers_alice)

        register_and_login(client, email="bob@example.com", username="bob")
        client.post(
            f"/api/boards/{board_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )

        resp = client.post(
            f"/api/cards/{card_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )
        assert resp.status_code == 201

    def test_add_card_member_user_not_found(self, client):
        _, _, headers = register_and_login(client)
        _, _, card_id = _setup_board_list_card(client, headers)

        resp = client.post(
            f"/api/cards/{card_id}/members/",
            json={"email": "nobody@example.com"},
            headers=headers,
        )
        assert resp.status_code == 404

    def test_add_card_member_not_board_member(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        _, _, card_id = _setup_board_list_card(client, headers_alice)

        register_and_login(client, email="bob@example.com", username="bob")

        resp = client.post(
            f"/api/cards/{card_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )
        assert resp.status_code == 400

    def test_add_card_member_already_assigned(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        board_id, _, card_id = _setup_board_list_card(client, headers_alice)

        register_and_login(client, email="bob@example.com", username="bob")
        client.post(
            f"/api/boards/{board_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )

        client.post(
            f"/api/cards/{card_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )
        resp = client.post(
            f"/api/cards/{card_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )
        assert resp.status_code == 400

    def test_add_card_member_not_authorized(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        board_id, _, card_id = _setup_board_list_card(client, headers_alice)

        _, _, headers_bob = register_and_login(client, email="bob@example.com", username="bob")

        resp = client.post(
            f"/api/cards/{card_id}/members/",
            json={"email": "alice@example.com"},
            headers=headers_bob,
        )
        assert resp.status_code == 403


class TestRemoveCardMember:
    def test_remove_card_member_success(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        board_id, _, card_id = _setup_board_list_card(client, headers_alice)

        register_and_login(client, email="bob@example.com", username="bob")
        client.post(
            f"/api/boards/{board_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )
        client.post(
            f"/api/cards/{card_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )

        resp = client.request(
            "DELETE",
            f"/api/cards/{card_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )
        assert resp.status_code == 204

    def test_remove_card_member_not_assigned(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        board_id, _, card_id = _setup_board_list_card(client, headers_alice)

        register_and_login(client, email="bob@example.com", username="bob")
        client.post(
            f"/api/boards/{board_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )

        resp = client.request(
            "DELETE",
            f"/api/cards/{card_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )
        assert resp.status_code == 404

    def test_remove_card_member_user_not_found(self, client):
        _, _, headers = register_and_login(client)
        _, _, card_id = _setup_board_list_card(client, headers)

        resp = client.request(
            "DELETE",
            f"/api/cards/{card_id}/members/",
            json={"email": "nobody@example.com"},
            headers=headers,
        )
        assert resp.status_code == 404
