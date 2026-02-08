from typing import Dict, Set
from uuid import UUID

from fastapi import WebSocket
import json
from fastapi.encoders import jsonable_encoder

class WSManager:
    def __init__(self) -> None:
        self.active_connections: Dict[UUID, Set[WebSocket]] = {}

    async def connect(self, board_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(board_id, set()).add(websocket)
        print("WS CONNECT", board_id, "connections:", len(self.active_connections[board_id]))

    async def broadcast(self, board_id, message: dict) -> None:
        conns = list(self.active_connections.get(board_id, []))
        print("WS BROADCAST", board_id, "connections:", len(conns), "message:", message.get("type"))

        safe_message = jsonable_encoder(message)  
        for ws in conns:
            try:
                await ws.send_json(safe_message)
            except Exception as e:
                print("WS SEND ERROR:", repr(e))
                self.disconnect(board_id, ws)

    def disconnect(self, board_id: UUID, websocket: WebSocket) -> None:
        if board_id in self.active_connections:
            self.active_connections[board_id].discard(websocket)
            if not self.active_connections[board_id]:
                del self.active_connections[board_id]

ws_manager = WSManager()
