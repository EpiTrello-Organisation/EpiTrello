"""Tests for /api/boards endpoints."""

import uuid
from tests.conftest import register_and_login


class TestListBoards:
    def test_list_boards_empty(self, client):
        _, _, headers = register_and_login(client)
        resp = client.get("/api/boards/", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_boards_returns_owned(self, client):
        _, _, headers = register_and_login(client)
        client.post("/api/boards/", json={"title": "B1"}, headers=headers)
        client.post("/api/boards/", json={"title": "B2"}, headers=headers)

        resp = client.get("/api/boards/", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_list_boards_no_auth(self, client):
        resp = client.get("/api/boards/")
        assert resp.status_code in (401, 403)


class TestCreateBoard:
    def test_create_board_success(self, client):
        _, _, headers = register_and_login(client)
        resp = client.post("/api/boards/", json={"title": "New Board"}, headers=headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "New Board"
        assert "id" in data
        assert data["background_kind"] == "gradient"

    def test_create_board_with_background(self, client):
        _, _, headers = register_and_login(client)
        resp = client.post(
            "/api/boards/",
            json={
                "title": "Styled",
                "background_kind": "unsplash",
                "background_value": "https://images.unsplash.com/photo",
                "background_thumb_url": "https://images.unsplash.com/thumb",
            },
            headers=headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["background_kind"] == "unsplash"
        assert data["background_value"] == "https://images.unsplash.com/photo"

    def test_create_board_no_title(self, client):
        _, _, headers = register_and_login(client)
        resp = client.post("/api/boards/", json={}, headers=headers)
        assert resp.status_code == 422

    def test_create_board_no_auth(self, client):
        resp = client.post("/api/boards/", json={"title": "X"})
        assert resp.status_code in (401, 403)


class TestGetBoard:
    def test_get_board_owner(self, client):
        _, _, headers = register_and_login(client)
        create_resp = client.post("/api/boards/", json={"title": "Mine"}, headers=headers)
        board_id = create_resp.json()["id"]

        resp = client.get(f"/api/boards/{board_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "Mine"

    def test_get_board_not_found(self, client):
        _, _, headers = register_and_login(client)
        fake_id = str(uuid.uuid4())
        resp = client.get(f"/api/boards/{fake_id}", headers=headers)
        assert resp.status_code == 404

    def test_get_board_not_member(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        create_resp = client.post("/api/boards/", json={"title": "Private"}, headers=headers_alice)
        board_id = create_resp.json()["id"]

        _, _, headers_bob = register_and_login(client, email="bob@example.com", username="bob")
        resp = client.get(f"/api/boards/{board_id}", headers=headers_bob)
        assert resp.status_code == 403


class TestUpdateBoard:
    def test_update_board_title(self, client):
        _, _, headers = register_and_login(client)
        create_resp = client.post("/api/boards/", json={"title": "Old"}, headers=headers)
        board_id = create_resp.json()["id"]

        resp = client.put(f"/api/boards/{board_id}", json={"title": "New"}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "New"

    def test_update_board_background(self, client):
        _, _, headers = register_and_login(client)
        create_resp = client.post("/api/boards/", json={"title": "BG"}, headers=headers)
        board_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/boards/{board_id}",
            json={"background_kind": "unsplash", "background_value": "url"},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["background_kind"] == "unsplash"

    def test_update_board_not_owner(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        create_resp = client.post("/api/boards/", json={"title": "Alice's"}, headers=headers_alice)
        board_id = create_resp.json()["id"]

        _, _, headers_bob = register_and_login(client, email="bob@example.com", username="bob")
        resp = client.put(f"/api/boards/{board_id}", json={"title": "Hacked"}, headers=headers_bob)
        assert resp.status_code == 403

    def test_update_board_not_found(self, client):
        _, _, headers = register_and_login(client)
        fake_id = str(uuid.uuid4())
        resp = client.put(f"/api/boards/{fake_id}", json={"title": "X"}, headers=headers)
        assert resp.status_code == 404


class TestDeleteBoard:
    def test_delete_board_success(self, client):
        _, _, headers = register_and_login(client)
        create_resp = client.post("/api/boards/", json={"title": "Bye"}, headers=headers)
        board_id = create_resp.json()["id"]

        resp = client.delete(f"/api/boards/{board_id}", headers=headers)
        assert resp.status_code == 204

        resp = client.get(f"/api/boards/{board_id}", headers=headers)
        assert resp.status_code == 404

    def test_delete_board_not_owner(self, client):
        _, _, headers_alice = register_and_login(client, email="alice@example.com", username="alice")
        create_resp = client.post("/api/boards/", json={"title": "Alice's"}, headers=headers_alice)
        board_id = create_resp.json()["id"]

        _, _, headers_bob = register_and_login(client, email="bob@example.com", username="bob")
        resp = client.delete(f"/api/boards/{board_id}", headers=headers_bob)
        assert resp.status_code == 403

    def test_delete_board_not_found(self, client):
        _, _, headers = register_and_login(client)
        fake_id = str(uuid.uuid4())
        resp = client.delete(f"/api/boards/{fake_id}", headers=headers)
        assert resp.status_code == 404
