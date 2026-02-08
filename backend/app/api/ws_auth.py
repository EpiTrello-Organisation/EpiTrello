from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi import WebSocket

from app.core.config import settings
from app.models.user import User

def get_user_from_ws(websocket: WebSocket, db: Session) -> User | None:
    token = websocket.query_params.get("token")
    if not token:
        return None

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
    except JWTError:
        return None

    return db.query(User).filter(User.id == user_id).first()