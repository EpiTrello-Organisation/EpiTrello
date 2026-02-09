"""Tests for /api/lists endpoints."""

import uuid
from tests.conftest import register_and_login


def _create_board(client, headers):
    """Helper to create a board and return its id."""
    resp = client.post("/api/boards/", json={"title": "Board"}, headers=headers)
    assert resp.status_code == 201
    return resp.json()["id"]


class TestGetLists:
    def test_get_lists_empty(self, client):
        _, _, headers = register_and_login(client)
        board_id = _create_board(client, headers)
        resp = client.get(f"/api/lists/board/{board_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_get_lists_returns_ordered(self, client):
        _, _, headers = register_and_login(client)
        board_id = _create_board(client, headers)

        client.post(f"/api/lists/?board_id={board_id}", json={"title": "First"}, headers=headers)
        client.post(f"/api/lists/?board_id={board_id}", json={"title": "Second"}, headers=headers)

        resp = client.get(f"/api/lists/board/{board_id}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert data[0]["title"] == "First"
        assert data[1]["title"] == "Second"
        assert data[0]["position"] < data[1]["position"]

    def test_get_lists_not_member(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        board_id = _create_board(client, headers_alice)

        _, _, headers_bob = register_and_login(client, email="bob@example.com", username="bob")
        resp = client.get(f"/api/lists/board/{board_id}", headers=headers_bob)
        assert resp.status_code == 403


class TestCreateList:
    def test_create_list_success(self, client):
        _, _, headers = register_and_login(client)
        board_id = _create_board(client, headers)

        resp = client.post(
            f"/api/lists/?board_id={board_id}",
            json={"title": "To Do"},
            headers=headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "To Do"
        assert data["position"] == 0
        assert data["board_id"] == board_id

    def test_create_list_auto_position(self, client):
        _, _, headers = register_and_login(client)
        board_id = _create_board(client, headers)

        client.post(f"/api/lists/?board_id={board_id}", json={"title": "A"}, headers=headers)
        resp = client.post(f"/api/lists/?board_id={board_id}", json={"title": "B"}, headers=headers)
        assert resp.json()["position"] == 1

    def test_create_list_not_member(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        board_id = _create_board(client, headers_alice)

        _, _, headers_bob = register_and_login(client, email="bob@example.com", username="bob")
        resp = client.post(
            f"/api/lists/?board_id={board_id}",
            json={"title": "Nope"},
            headers=headers_bob,
        )
        assert resp.status_code == 403


class TestUpdateList:
    def test_update_list_title(self, client):
        _, _, headers = register_and_login(client)
        board_id = _create_board(client, headers)

        create_resp = client.post(f"/api/lists/?board_id={board_id}", json={"title": "Old"}, headers=headers)
        list_id = create_resp.json()["id"]

        resp = client.put(f"/api/lists/{list_id}", json={"title": "New"}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "New"

    def test_update_list_position(self, client):
        _, _, headers = register_and_login(client)
        board_id = _create_board(client, headers)

        create_resp = client.post(f"/api/lists/?board_id={board_id}", json={"title": "L"}, headers=headers)
        list_id = create_resp.json()["id"]

        resp = client.put(f"/api/lists/{list_id}", json={"position": 5}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["position"] == 5

    def test_update_list_not_found(self, client):
        _, _, headers = register_and_login(client)
        fake_id = str(uuid.uuid4())
        resp = client.put(f"/api/lists/{fake_id}", json={"title": "X"}, headers=headers)
        assert resp.status_code == 404

    def test_update_list_not_member(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        board_id = _create_board(client, headers_alice)
        create_resp = client.post(f"/api/lists/?board_id={board_id}", json={"title": "L"}, headers=headers_alice)
        list_id = create_resp.json()["id"]

        _, _, headers_bob = register_and_login(client, email="bob@example.com", username="bob")
        resp = client.put(f"/api/lists/{list_id}", json={"title": "Hacked"}, headers=headers_bob)
        assert resp.status_code == 403


class TestDeleteList:
    def test_delete_list_success(self, client):
        _, _, headers = register_and_login(client)
        board_id = _create_board(client, headers)
        create_resp = client.post(f"/api/lists/?board_id={board_id}", json={"title": "Bye"}, headers=headers)
        list_id = create_resp.json()["id"]

        resp = client.delete(f"/api/lists/{list_id}", headers=headers)
        assert resp.status_code == 204

    def test_delete_list_not_found(self, client):
        _, _, headers = register_and_login(client)
        fake_id = str(uuid.uuid4())
        resp = client.delete(f"/api/lists/{fake_id}", headers=headers)
        assert resp.status_code == 404

    def test_delete_list_not_member(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        board_id = _create_board(client, headers_alice)
        create_resp = client.post(f"/api/lists/?board_id={board_id}", json={"title": "L"}, headers=headers_alice)
        list_id = create_resp.json()["id"]

        _, _, headers_bob = register_and_login(client, email="bob@example.com", username="bob")
        resp = client.delete(f"/api/lists/{list_id}", headers=headers_bob)
        assert resp.status_code == 403
