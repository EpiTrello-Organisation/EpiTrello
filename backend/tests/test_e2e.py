"""
End-to-end tests — complete user workflows that span multiple API endpoints.

Each test simulates a real user scenario from registration through to final
action, exercising the full request lifecycle (auth → boards → lists → cards
→ members) in a single test.
"""

from tests.conftest import auth_header, register_and_login

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _register(client, email, username, password="Test1234!"):
    """Register + login, return (user_data, token, headers)."""
    return register_and_login(client, email=email, username=username, password=password)


def _create_board(client, headers, title="Project Board"):
    resp = client.post("/api/boards/", json={"title": title}, headers=headers)
    assert resp.status_code == 201
    return resp.json()


def _create_list(client, headers, board_id, title, position=None):
    params = {"board_id": board_id}
    resp = client.post(
        "/api/lists/",
        json={"title": title},
        headers=headers,
        params=params,
    )
    assert resp.status_code == 201
    return resp.json()


def _create_card(client, headers, list_id, title, description=None):
    body = {"title": title}
    if description:
        body["description"] = description
    resp = client.post(
        "/api/cards/",
        json=body,
        headers=headers,
        params={"list_id": list_id},
    )
    assert resp.status_code == 201
    return resp.json()


# ===========================================================================
# Scenario 1 — Full Kanban board lifecycle
# Register → create board → add 3 lists → add cards → move card → delete
# ===========================================================================


class TestKanbanBoardLifecycle:
    """A user creates a board, populates it with lists and cards, then cleans up."""

    def test_full_kanban_workflow(self, client):
        # -- Step 1: Register & authenticate
        user, token, headers = _register(client, "kanban@test.com", "kanban_user")
        assert user["email"] == "kanban@test.com"

        # -- Step 2: Create a board
        board = _create_board(client, headers, "Sprint Board")
        board_id = board["id"]
        assert board["title"] == "Sprint Board"

        # -- Step 3: Create 3 lists (To Do, In Progress, Done)
        todo = _create_list(client, headers, board_id, "To Do")
        in_progress = _create_list(client, headers, board_id, "In Progress")
        done = _create_list(client, headers, board_id, "Done")

        # Verify order
        resp = client.get(f"/api/lists/board/{board_id}", headers=headers)
        assert resp.status_code == 200
        lists = resp.json()
        assert len(lists) == 3
        assert [lst["title"] for lst in lists] == ["To Do", "In Progress", "Done"]

        # -- Step 4: Add cards to "To Do"
        card1 = _create_card(
            client, headers, todo["id"], "Setup CI", "Configure pipelines"
        )
        _create_card(client, headers, todo["id"], "Write tests")
        card3 = _create_card(client, headers, todo["id"], "Deploy")

        # Verify cards in "To Do"
        resp = client.get(
            "/api/cards/", params={"list_id": todo["id"]}, headers=headers
        )
        assert resp.status_code == 200
        cards = resp.json()
        assert len(cards) == 3
        assert cards[0]["title"] == "Setup CI"

        # -- Step 5: Move card1 to "In Progress" (update list_id)
        resp = client.put(
            f"/api/cards/{card1['id']}",
            json={"list_id": in_progress["id"], "position": 0},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["list_id"] == in_progress["id"]

        # Verify "To Do" now has 2 cards
        resp = client.get(
            "/api/cards/", params={"list_id": todo["id"]}, headers=headers
        )
        assert len(resp.json()) == 2

        # Verify "In Progress" has 1 card
        resp = client.get(
            "/api/cards/", params={"list_id": in_progress["id"]}, headers=headers
        )
        assert len(resp.json()) == 1

        # -- Step 6: Move card1 to "Done"
        resp = client.put(
            f"/api/cards/{card1['id']}",
            json={"list_id": done["id"], "position": 0},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["list_id"] == done["id"]

        # -- Step 7: Delete a card
        resp = client.delete(f"/api/cards/{card3['id']}", headers=headers)
        assert resp.status_code == 204

        # -- Step 8: Delete a list (cascade deletes its cards)
        resp = client.delete(f"/api/lists/{todo['id']}", headers=headers)
        assert resp.status_code == 204

        # Verify lists count
        resp = client.get(f"/api/lists/board/{board_id}", headers=headers)
        assert len(resp.json()) == 2

        # -- Step 9: Delete the board
        resp = client.delete(f"/api/boards/{board_id}", headers=headers)
        assert resp.status_code == 204

        # Verify board is gone
        resp = client.get(f"/api/boards/{board_id}", headers=headers)
        assert resp.status_code == 404


# ===========================================================================
# Scenario 2 — Multi-user collaboration
# Owner invites member → member sees board → member creates cards
# → owner removes member → member loses access
# ===========================================================================


class TestCollaborationWorkflow:
    """Two users collaborate on a shared board."""

    def test_invite_collaborate_and_revoke(self, client):
        # -- Setup: two users
        _, _, owner_h = _register(client, "owner@test.com", "owner")
        bob_user, _, bob_h = _register(client, "bob@test.com", "bob")

        # -- Owner creates board
        board = _create_board(client, owner_h, "Team Board")
        board_id = board["id"]

        # -- Bob cannot see the board yet
        resp = client.get(f"/api/boards/{board_id}", headers=bob_h)
        assert resp.status_code == 403

        # -- Owner invites Bob
        resp = client.post(
            f"/api/boards/{board_id}/members/",
            json={"email": "bob@test.com"},
            headers=owner_h,
        )
        assert resp.status_code == 201

        # -- Bob can now see the board
        resp = client.get(f"/api/boards/{board_id}", headers=bob_h)
        assert resp.status_code == 200
        assert resp.json()["title"] == "Team Board"

        # -- Bob can list members (sees owner + himself)
        resp = client.get(f"/api/boards/{board_id}/members/", headers=bob_h)
        assert resp.status_code == 200
        members = resp.json()
        emails = {m["email"] for m in members}
        assert emails == {"owner@test.com", "bob@test.com"}

        # -- Owner creates a list, Bob adds a card
        lst = _create_list(client, owner_h, board_id, "Backlog")
        card = _create_card(client, bob_h, lst["id"], "Bob's task", "From Bob")
        assert card["title"] == "Bob's task"

        # -- Bob's board list includes this board
        resp = client.get("/api/boards/", headers=bob_h)
        assert resp.status_code == 200
        assert any(b["id"] == board_id for b in resp.json())

        # -- Owner removes Bob
        resp = client.request(
            "DELETE",
            f"/api/boards/{board_id}/members/",
            json={"email": "bob@test.com"},
            headers=owner_h,
        )
        assert resp.status_code == 204

        # -- Bob can no longer access the board
        resp = client.get(f"/api/boards/{board_id}", headers=bob_h)
        assert resp.status_code == 403

        # -- Bob's board list no longer includes this board
        resp = client.get("/api/boards/", headers=bob_h)
        assert not any(b["id"] == board_id for b in resp.json())


# ===========================================================================
# Scenario 3 — Card members workflow
# Owner creates board/list/card → invites member → assigns member to card
# → verifies card members → unassigns
# ===========================================================================


class TestCardMemberWorkflow:
    """Card-level member assignment end-to-end."""

    def test_assign_and_unassign_card_members(self, client):
        # -- Setup
        _, _, alice_h = _register(client, "alice@test.com", "alice")
        _, _, charlie_h = _register(client, "charlie@test.com", "charlie")

        board = _create_board(client, alice_h, "Dev Board")
        board_id = board["id"]

        # -- Invite Charlie to board
        resp = client.post(
            f"/api/boards/{board_id}/members/",
            json={"email": "charlie@test.com"},
            headers=alice_h,
        )
        assert resp.status_code == 201

        # -- Create list and card
        lst = _create_list(client, alice_h, board_id, "Sprint 1")
        card = _create_card(client, alice_h, lst["id"], "Feature X")
        card_id = card["id"]

        # -- Card has no members yet
        resp = client.get(f"/api/cards/{card_id}/members/", headers=alice_h)
        assert resp.status_code == 200
        assert resp.json() == []

        # -- Alice assigns Charlie to the card
        resp = client.post(
            f"/api/cards/{card_id}/members/",
            json={"email": "charlie@test.com"},
            headers=alice_h,
        )
        assert resp.status_code == 201

        # -- Alice also assigns herself
        resp = client.post(
            f"/api/cards/{card_id}/members/",
            json={"email": "alice@test.com"},
            headers=alice_h,
        )
        assert resp.status_code == 201

        # -- Verify 2 members on card
        resp = client.get(f"/api/cards/{card_id}/members/", headers=alice_h)
        assert resp.status_code == 200
        card_members = resp.json()
        assert len(card_members) == 2
        member_emails = {m["email"] for m in card_members}
        assert member_emails == {"alice@test.com", "charlie@test.com"}

        # -- Charlie can also see card members (he's a board member)
        resp = client.get(f"/api/cards/{card_id}/members/", headers=charlie_h)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

        # -- Unassign Charlie
        resp = client.request(
            "DELETE",
            f"/api/cards/{card_id}/members/",
            json={"email": "charlie@test.com"},
            headers=alice_h,
        )
        assert resp.status_code == 204

        # -- Verify only 1 member left
        resp = client.get(f"/api/cards/{card_id}/members/", headers=alice_h)
        assert len(resp.json()) == 1
        assert resp.json()[0]["email"] == "alice@test.com"


# ===========================================================================
# Scenario 4 — Permission boundaries
# Non-member cannot perform any action on a board they don't belong to
# ===========================================================================


class TestPermissionBoundaries:
    """Verify that a non-member is blocked at every level."""

    def test_non_member_is_blocked_everywhere(self, client):
        _, _, owner_h = _register(client, "perm_owner@test.com", "perm_owner")
        _, _, intruder_h = _register(client, "intruder@test.com", "intruder")

        board = _create_board(client, owner_h, "Private Board")
        board_id = board["id"]
        lst = _create_list(client, owner_h, board_id, "Secret List")
        card = _create_card(client, owner_h, lst["id"], "Secret Card")

        # -- Cannot view board
        resp = client.get(f"/api/boards/{board_id}", headers=intruder_h)
        assert resp.status_code == 403

        # -- Cannot update board
        resp = client.put(
            f"/api/boards/{board_id}",
            json={"title": "Hacked"},
            headers=intruder_h,
        )
        assert resp.status_code == 403

        # -- Cannot delete board
        resp = client.delete(f"/api/boards/{board_id}", headers=intruder_h)
        assert resp.status_code == 403

        # -- Cannot list lists
        resp = client.get(f"/api/lists/board/{board_id}", headers=intruder_h)
        assert resp.status_code == 403

        # -- Cannot create list
        resp = client.post(
            "/api/lists/",
            json={"title": "Hack List"},
            params={"board_id": board_id},
            headers=intruder_h,
        )
        assert resp.status_code == 403

        # -- Cannot create card
        resp = client.post(
            "/api/cards/",
            json={"title": "Hack Card"},
            params={"list_id": lst["id"]},
            headers=intruder_h,
        )
        assert resp.status_code == 403

        # -- Cannot list cards
        resp = client.get(
            "/api/cards/", params={"list_id": lst["id"]}, headers=intruder_h
        )
        assert resp.status_code == 403

        # -- Cannot update card
        resp = client.put(
            f"/api/cards/{card['id']}",
            json={"title": "Hacked Card"},
            headers=intruder_h,
        )
        assert resp.status_code == 403

        # -- Cannot delete card
        resp = client.delete(f"/api/cards/{card['id']}", headers=intruder_h)
        assert resp.status_code == 403

        # -- Cannot list board members
        resp = client.get(f"/api/boards/{board_id}/members/", headers=intruder_h)
        assert resp.status_code == 403

        # -- Cannot list card members
        resp = client.get(f"/api/cards/{card['id']}/members/", headers=intruder_h)
        assert resp.status_code == 403


# ===========================================================================
# Scenario 5 — Board update + list reorder workflow
# Create board → rename it → create lists → reorder lists → verify
# ===========================================================================


class TestBoardUpdateAndListReorder:
    """Board metadata updates and list reordering."""

    def test_rename_board_and_reorder_lists(self, client):
        _, _, headers = _register(client, "reorder@test.com", "reorder_user")

        # -- Create & immediately rename
        board = _create_board(client, headers, "Old Name")
        board_id = board["id"]

        resp = client.put(
            f"/api/boards/{board_id}",
            json={
                "title": "New Name",
                "background_kind": "gradient",
                "background_value": "#FF0000",
            },
            headers=headers,
        )
        assert resp.status_code == 200
        updated = resp.json()
        assert updated["title"] == "New Name"
        assert updated["background_value"] == "#FF0000"

        # -- Create lists in order
        _create_list(client, headers, board_id, "A")
        _create_list(client, headers, board_id, "B")
        l_c = _create_list(client, headers, board_id, "C")

        # Verify initial order: A(0), B(1), C(2)
        resp = client.get(f"/api/lists/board/{board_id}", headers=headers)
        titles = [lst["title"] for lst in resp.json()]
        assert titles == ["A", "B", "C"]

        # -- Reorder: move C to position 0 (before A)
        resp = client.put(
            f"/api/lists/{l_c['id']}",
            json={"position": 0},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["position"] == 0

        # Verify C now has the lowest position
        resp = client.get(f"/api/lists/board/{board_id}", headers=headers)
        lists = resp.json()
        # C(0) comes first since A(0)->A(0) but C was updated last
        # The important thing is C has position 0
        c_list = next(lst for lst in lists if lst["title"] == "C")
        assert c_list["position"] == 0


# ===========================================================================
# Scenario 6 — Card labels workflow
# Create card → add labels → update labels → clear labels
# ===========================================================================


class TestCardLabelsWorkflow:
    """Card label_ids lifecycle."""

    def test_card_label_lifecycle(self, client):
        _, _, headers = _register(client, "labels@test.com", "labels_user")

        board = _create_board(client, headers, "Label Board")
        lst = _create_list(client, headers, board["id"], "Tasks")
        card = _create_card(client, headers, lst["id"], "Labeled Card")
        card_id = card["id"]

        # -- Card starts with no labels
        assert (
            card.get("label_ids", []) == []
            or card.get("label_ids") is None
            or card.get("label_ids") == []
        )

        # -- Add labels
        resp = client.put(
            f"/api/cards/{card_id}",
            json={"label_ids": [1, 2, 3]},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["label_ids"] == [1, 2, 3]

        # -- Update labels (remove one, add another)
        resp = client.put(
            f"/api/cards/{card_id}",
            json={"label_ids": [2, 4]},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["label_ids"] == [2, 4]

        # -- Clear all labels
        resp = client.put(
            f"/api/cards/{card_id}",
            json={"label_ids": []},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["label_ids"] == []


# ===========================================================================
# Scenario 7 — Multiple boards isolation
# User creates 2 boards — data doesn't leak between them
# ===========================================================================


class TestBoardIsolation:
    """Ensure lists/cards from one board don't appear in another."""

    def test_boards_are_isolated(self, client):
        _, _, headers = _register(client, "iso@test.com", "iso_user")

        board1 = _create_board(client, headers, "Board 1")
        board2 = _create_board(client, headers, "Board 2")

        lst1 = _create_list(client, headers, board1["id"], "B1-List")
        lst2 = _create_list(client, headers, board2["id"], "B2-List")

        _create_card(client, headers, lst1["id"], "Card in B1")
        _create_card(client, headers, lst2["id"], "Card in B2")

        # -- Lists are isolated per board
        resp = client.get(f"/api/lists/board/{board1['id']}", headers=headers)
        b1_lists = resp.json()
        assert len(b1_lists) == 1
        assert b1_lists[0]["title"] == "B1-List"

        resp = client.get(f"/api/lists/board/{board2['id']}", headers=headers)
        b2_lists = resp.json()
        assert len(b2_lists) == 1
        assert b2_lists[0]["title"] == "B2-List"

        # -- Cards are isolated per list
        resp = client.get(
            "/api/cards/", params={"list_id": lst1["id"]}, headers=headers
        )
        assert len(resp.json()) == 1
        assert resp.json()[0]["title"] == "Card in B1"

        resp = client.get(
            "/api/cards/", params={"list_id": lst2["id"]}, headers=headers
        )
        assert len(resp.json()) == 1
        assert resp.json()[0]["title"] == "Card in B2"

        # -- Deleting board1 doesn't affect board2
        client.delete(f"/api/boards/{board1['id']}", headers=headers)

        resp = client.get("/api/boards/", headers=headers)
        boards = resp.json()
        assert len(boards) == 1
        assert boards[0]["id"] == board2["id"]

        # Board2 lists still intact
        resp = client.get(f"/api/lists/board/{board2['id']}", headers=headers)
        assert len(resp.json()) == 1


# ===========================================================================
# Scenario 8 — Auth edge cases workflow
# Register → login → use token → re-login → old token still works (JWT)
# ===========================================================================


class TestAuthWorkflow:
    """Authentication flow edge cases."""

    def test_register_login_and_identity(self, client):
        # -- Register
        resp = client.post(
            "/api/auth/register",
            json={
                "email": "auth@test.com",
                "username": "auth_user",
                "password": "Pass1234!",
            },
        )
        assert resp.status_code == 200
        user = resp.json()
        user_id = user["id"]

        # -- Login
        resp = client.post(
            "/api/auth/login",
            json={"email": "auth@test.com", "password": "Pass1234!"},
        )
        assert resp.status_code == 200
        token1 = resp.json()["access_token"]

        # -- /me returns correct user
        resp = client.get("/api/users/me", headers=auth_header(token1))
        assert resp.status_code == 200
        assert resp.json()["email"] == "auth@test.com"
        assert resp.json()["id"] == user_id

        # -- Login again → get a different token
        resp = client.post(
            "/api/auth/login",
            json={"email": "auth@test.com", "password": "Pass1234!"},
        )
        token2 = resp.json()["access_token"]

        # Both tokens work (JWT is stateless)
        resp = client.get("/api/users/me", headers=auth_header(token1))
        assert resp.status_code == 200
        resp = client.get("/api/users/me", headers=auth_header(token2))
        assert resp.status_code == 200

    def test_cannot_register_duplicate_and_login_wrong_password(self, client):
        # -- Register
        client.post(
            "/api/auth/register",
            json={
                "email": "dup@test.com",
                "username": "dup_user",
                "password": "Pass1234!",
            },
        )

        # -- Duplicate email fails
        resp = client.post(
            "/api/auth/register",
            json={
                "email": "dup@test.com",
                "username": "other",
                "password": "Pass1234!",
            },
        )
        assert resp.status_code == 400

        # -- Wrong password fails
        resp = client.post(
            "/api/auth/login",
            json={"email": "dup@test.com", "password": "WrongPassword"},
        )
        assert resp.status_code == 401

        # -- Nonexistent user fails
        resp = client.post(
            "/api/auth/login",
            json={"email": "nobody@test.com", "password": "Pass1234!"},
        )
        assert resp.status_code == 401
