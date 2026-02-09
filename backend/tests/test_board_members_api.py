"""Tests for /api/boards/{board_id}/members endpoints."""

from tests.conftest import register_and_login


def _setup_board(client, headers):
    resp = client.post("/api/boards/", json={"title": "Board"}, headers=headers)
    return resp.json()["id"]


class TestAddBoardMember:
    def test_add_member_success(self, client):
        _, _, headers_alice = register_and_login(
            client, email="alice@example.com", username="alice"
        )
        board_id = _setup_board(client, headers_alice)

        register_and_login(client, email="bob@example.com", username="bob")

        resp = client.post(
            f"/api/boards/{board_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )
        assert resp.status_code == 201
        assert resp.json()["detail"] == "Member added"

    def test_add_member_user_not_found(self, client):
        _, _, headers = register_and_login(client)
        board_id = _setup_board(client, headers)

        resp = client.post(
            f"/api/boards/{board_id}/members/",
            json={"email": "nobody@example.com"},
            headers=headers,
        )
        assert resp.status_code == 404

    def test_add_member_already_member(self, client):
        _, _, headers_alice = register_and_login(
            client, email="alice@example.com", username="alice"
        )
        board_id = _setup_board(client, headers_alice)

        register_and_login(client, email="bob@example.com", username="bob")
        client.post(
            f"/api/boards/{board_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )

        resp = client.post(
            f"/api/boards/{board_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )
        assert resp.status_code == 400

    def test_add_member_not_owner(self, client):
        _, _, headers_alice = register_and_login(
            client, email="alice@example.com", username="alice"
        )
        board_id = _setup_board(client, headers_alice)

        _, _, headers_bob = register_and_login(
            client, email="bob@example.com", username="bob"
        )

        register_and_login(client, email="charlie@example.com", username="charlie")

        client.post(
            f"/api/boards/{board_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )

        resp = client.post(
            f"/api/boards/{board_id}/members/",
            json={"email": "charlie@example.com"},
            headers=headers_bob,
        )
        assert resp.status_code == 403


class TestListBoardMembers:
    def test_list_members_owner_only(self, client):
        _, _, headers = register_and_login(
            client, email="alice@example.com", username="alice"
        )
        board_id = _setup_board(client, headers)

        resp = client.get(f"/api/boards/{board_id}/members/", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["role"] == "owner"

    def test_list_members_multiple(self, client):
        _, _, headers_alice = register_and_login(
            client, email="alice@example.com", username="alice"
        )
        board_id = _setup_board(client, headers_alice)

        register_and_login(client, email="bob@example.com", username="bob")
        client.post(
            f"/api/boards/{board_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )

        resp = client.get(f"/api/boards/{board_id}/members/", headers=headers_alice)
        assert len(resp.json()) == 2

    def test_list_members_not_member(self, client):
        _, _, headers_alice = register_and_login(
            client, email="alice@example.com", username="alice"
        )
        board_id = _setup_board(client, headers_alice)

        _, _, headers_bob = register_and_login(
            client, email="bob@example.com", username="bob"
        )
        resp = client.get(f"/api/boards/{board_id}/members/", headers=headers_bob)
        assert resp.status_code == 403


class TestRemoveBoardMember:
    def test_remove_member_success(self, client):
        _, _, headers_alice = register_and_login(
            client, email="alice@example.com", username="alice"
        )
        board_id = _setup_board(client, headers_alice)

        register_and_login(client, email="bob@example.com", username="bob")
        client.post(
            f"/api/boards/{board_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )

        resp = client.delete(
            f"/api/boards/{board_id}/members/",
            headers=headers_alice,
            params={"email": "bob@example.com"},
        )

        resp = client.request(
            "DELETE",
            f"/api/boards/{board_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )
        assert resp.status_code == 204

    def test_remove_member_user_not_found(self, client):
        _, _, headers = register_and_login(client)
        board_id = _setup_board(client, headers)

        resp = client.request(
            "DELETE",
            f"/api/boards/{board_id}/members/",
            json={"email": "nobody@example.com"},
            headers=headers,
        )
        assert resp.status_code == 404

    def test_remove_owner_fails(self, client):
        _, _, headers_alice = register_and_login(
            client, email="alice@example.com", username="alice"
        )
        board_id = _setup_board(client, headers_alice)

        resp = client.request(
            "DELETE",
            f"/api/boards/{board_id}/members/",
            json={"email": "alice@example.com"},
            headers=headers_alice,
        )
        assert resp.status_code == 400
        assert "owner" in resp.json()["detail"].lower()

    def test_remove_non_member(self, client):
        _, _, headers_alice = register_and_login(
            client, email="alice@example.com", username="alice"
        )
        board_id = _setup_board(client, headers_alice)

        register_and_login(client, email="bob@example.com", username="bob")
        resp = client.request(
            "DELETE",
            f"/api/boards/{board_id}/members/",
            json={"email": "bob@example.com"},
            headers=headers_alice,
        )
        assert resp.status_code == 404
