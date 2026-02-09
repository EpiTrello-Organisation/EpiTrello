"""Tests for /api/cards endpoints."""

import uuid
from tests.conftest import register_and_login


def _setup_board_and_list(client, headers):
    """Create a board + list, return (board_id, list_id)."""
    board_resp = client.post("/api/boards/", json={"title": "Board"}, headers=headers)
    board_id = board_resp.json()["id"]
    list_resp = client.post(f"/api/lists/?board_id={board_id}", json={"title": "List"}, headers=headers)
    list_id = list_resp.json()["id"]
    return board_id, list_id


class TestCreateCard:
    def test_create_card_success(self, client):
        _, _, headers = register_and_login(client)
        _, list_id = _setup_board_and_list(client, headers)

        resp = client.post(
            f"/api/cards/?list_id={list_id}",
            json={"title": "Card 1"},
            headers=headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Card 1"
        assert data["position"] == 0
        assert data["list_id"] == list_id

    def test_create_card_with_description(self, client):
        _, _, headers = register_and_login(client)
        _, list_id = _setup_board_and_list(client, headers)

        resp = client.post(
            f"/api/cards/?list_id={list_id}",
            json={"title": "Card", "description": "Some desc"},
            headers=headers,
        )
        assert resp.status_code == 201
        assert resp.json()["description"] == "Some desc"

    def test_create_card_auto_position(self, client):
        _, _, headers = register_and_login(client)
        _, list_id = _setup_board_and_list(client, headers)

        client.post(f"/api/cards/?list_id={list_id}", json={"title": "A"}, headers=headers)
        resp = client.post(f"/api/cards/?list_id={list_id}", json={"title": "B"}, headers=headers)
        assert resp.json()["position"] == 1

    def test_create_card_list_not_found(self, client):
        _, _, headers = register_and_login(client)
        fake_id = str(uuid.uuid4())
        resp = client.post(f"/api/cards/?list_id={fake_id}", json={"title": "X"}, headers=headers)
        assert resp.status_code == 404

    def test_create_card_not_member(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        _, list_id = _setup_board_and_list(client, headers_alice)

        _, _, headers_bob = register_and_login(client, email="bob@example.com", username="bob")
        resp = client.post(f"/api/cards/?list_id={list_id}", json={"title": "Nope"}, headers=headers_bob)
        assert resp.status_code == 403


class TestListCards:
    def test_list_cards_empty(self, client):
        _, _, headers = register_and_login(client)
        _, list_id = _setup_board_and_list(client, headers)

        resp = client.get(f"/api/cards/?list_id={list_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_cards_returns_ordered(self, client):
        _, _, headers = register_and_login(client)
        _, list_id = _setup_board_and_list(client, headers)

        client.post(f"/api/cards/?list_id={list_id}", json={"title": "First"}, headers=headers)
        client.post(f"/api/cards/?list_id={list_id}", json={"title": "Second"}, headers=headers)

        resp = client.get(f"/api/cards/?list_id={list_id}", headers=headers)
        data = resp.json()
        assert len(data) == 2
        assert data[0]["title"] == "First"

    def test_list_cards_list_not_found(self, client):
        _, _, headers = register_and_login(client)
        fake_id = str(uuid.uuid4())
        resp = client.get(f"/api/cards/?list_id={fake_id}", headers=headers)
        assert resp.status_code == 404

    def test_list_cards_not_member(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        _, list_id = _setup_board_and_list(client, headers_alice)

        _, _, headers_bob = register_and_login(client, email="bob@example.com", username="bob")
        resp = client.get(f"/api/cards/?list_id={list_id}", headers=headers_bob)
        assert resp.status_code == 403


class TestUpdateCard:
    def test_update_card_title(self, client):
        _, _, headers = register_and_login(client)
        _, list_id = _setup_board_and_list(client, headers)
        create_resp = client.post(f"/api/cards/?list_id={list_id}", json={"title": "Old"}, headers=headers)
        card_id = create_resp.json()["id"]

        resp = client.put(f"/api/cards/{card_id}", json={"title": "New"}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "New"

    def test_update_card_description(self, client):
        _, _, headers = register_and_login(client)
        _, list_id = _setup_board_and_list(client, headers)
        create_resp = client.post(f"/api/cards/?list_id={list_id}", json={"title": "C"}, headers=headers)
        card_id = create_resp.json()["id"]

        resp = client.put(f"/api/cards/{card_id}", json={"description": "Updated"}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["description"] == "Updated"

    def test_update_card_position(self, client):
        _, _, headers = register_and_login(client)
        _, list_id = _setup_board_and_list(client, headers)
        create_resp = client.post(f"/api/cards/?list_id={list_id}", json={"title": "C"}, headers=headers)
        card_id = create_resp.json()["id"]

        resp = client.put(f"/api/cards/{card_id}", json={"position": 10}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["position"] == 10

    def test_update_card_not_found(self, client):
        _, _, headers = register_and_login(client)
        fake_id = str(uuid.uuid4())
        resp = client.put(f"/api/cards/{fake_id}", json={"title": "X"}, headers=headers)
        assert resp.status_code == 404

    def test_update_card_not_member(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        _, list_id = _setup_board_and_list(client, headers_alice)
        create_resp = client.post(f"/api/cards/?list_id={list_id}", json={"title": "C"}, headers=headers_alice)
        card_id = create_resp.json()["id"]

        _, _, headers_bob = register_and_login(client, email="bob@example.com", username="bob")
        resp = client.put(f"/api/cards/{card_id}", json={"title": "X"}, headers=headers_bob)
        assert resp.status_code == 403


class TestDeleteCard:
    def test_delete_card_success(self, client):
        _, _, headers = register_and_login(client)
        _, list_id = _setup_board_and_list(client, headers)
        create_resp = client.post(f"/api/cards/?list_id={list_id}", json={"title": "Bye"}, headers=headers)
        card_id = create_resp.json()["id"]

        resp = client.delete(f"/api/cards/{card_id}", headers=headers)
        assert resp.status_code == 204

    def test_delete_card_not_found(self, client):
        _, _, headers = register_and_login(client)
        fake_id = str(uuid.uuid4())
        resp = client.delete(f"/api/cards/{fake_id}", headers=headers)
        assert resp.status_code == 404

    def test_delete_card_not_member(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        _, list_id = _setup_board_and_list(client, headers_alice)
        create_resp = client.post(f"/api/cards/?list_id={list_id}", json={"title": "C"}, headers=headers_alice)
        card_id = create_resp.json()["id"]

        _, _, headers_bob = register_and_login(client, email="bob@example.com", username="bob")
        resp = client.delete(f"/api/cards/{card_id}", headers=headers_bob)
        assert resp.status_code == 403
