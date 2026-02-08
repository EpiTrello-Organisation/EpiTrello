from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.ws_auth import get_user_from_ws
from app.core.ws_manager import ws_manager
from app.models.board_member import BoardMember

router = APIRouter(tags=["WebSockets"])


@router.websocket("/ws/boards/{board_id}")
async def board_ws(websocket: WebSocket, board_id: UUID):
    # ouvrir une session db “manuelle” car Depends ne marche pas pareil en WS
    db_gen = get_db()
    db: Session = next(db_gen)

    try:
        user = get_user_from_ws(websocket, db)
        if not user:
            await websocket.close(code=1008)  # policy violation
            return

        # Vérifier que l'utilisateur est membre du board
        is_member = (
            db.query(BoardMember)
            .filter(BoardMember.board_id == board_id, BoardMember.user_id == user.id)
            .first()
        )
        if not is_member:
            await websocket.close(code=1008)
            return

        await ws_manager.connect(board_id, websocket)
        await websocket.send_json({"type": "ws.connected", "payload": {"board_id": str(board_id)}})


        # Loop d’écoute (utile si tu veux recevoir des messages, sinon tu peux juste keep alive)
        while True:
            _ = await websocket.receive_text()  # on ignore pour l’instant

    except WebSocketDisconnect:
        ws_manager.disconnect(board_id, websocket)
    finally:
        try:
            db.close()
        except Exception:
            pass
