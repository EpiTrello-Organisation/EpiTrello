from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.boards import router as boards_router
from app.api.lists import router as lists_router
from app.api.cards import router as cards_router
from app.api.board_members import router as board_members_router
from app.api.card_members import router as card_members_router
from app.api.ws import router as ws_router

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(boards_router)
api_router.include_router(lists_router)
api_router.include_router(cards_router)
api_router.include_router(board_members_router)
api_router.include_router(card_members_router)
api_router.include_router(ws_router)