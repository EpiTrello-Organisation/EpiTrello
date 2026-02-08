from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.core.ws_manager import ws_manager
from app.models.board import Board
from app.models.board_member import BoardMember
from app.models.user import User
from app.schemas.board import BoardCreate, BoardOut, BoardUpdate

router = APIRouter(prefix="/boards", tags=["Boards"])


@router.get("/", response_model=list[BoardOut])
def list_boards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Board)
        .join(BoardMember, BoardMember.board_id == Board.id)
        .filter(BoardMember.user_id == current_user.id)
        .all()
    )


@router.post("/", response_model=BoardOut, status_code=status.HTTP_201_CREATED)
async def create_board(
    board_in: BoardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = Board(
        title=board_in.title,
        owner_id=current_user.id,
    )
    db.add(board)
    db.flush()

    board_member = BoardMember(
        board_id=board.id,
        user_id=current_user.id,
        role="owner",
    )
    db.add(board_member)

    db.commit()
    db.refresh(board)

    # 🔔 WebSocket event (le creator est le seul connecté à ce moment-là)
    await ws_manager.broadcast(
        board.id,
        {
            "type": "board.created",
            "payload": {
                "board_id": str(board.id),
                "title": board.title,
                "owner_id": str(current_user.id),
            },
        },
    )

    return board


@router.get("/{board_id}", response_model=BoardOut)
def get_board(
    board_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = db.query(Board).filter(Board.id == board_id).first()

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    if board.owner_id != current_user.id:
        membership = (
            db.query(BoardMember)
            .filter(
                BoardMember.board_id == board.id,
                BoardMember.user_id == current_user.id,
            )
            .first()
        )
        if not membership:
            raise HTTPException(status_code=403, detail="Not authorized")

    return board


@router.put("/{board_id}", response_model=BoardOut)
async def update_board(
    board_id: UUID,
    board_in: BoardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = db.query(Board).filter(Board.id == board_id).first()

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    board.title = board_in.title
    db.commit()
    db.refresh(board)

    # 🔔 WebSocket event
    await ws_manager.broadcast(
        board.id,
        {
            "type": "board.updated",
            "payload": {
                "board_id": str(board.id),
                "title": board.title,
                "updated_by": str(current_user.id),
            },
        },
    )

    return board


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board(
    board_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = db.query(Board).filter(Board.id == board_id).first()

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 🔔 WebSocket event (avant suppression)
    await ws_manager.broadcast(
        board.id,
        {
            "type": "board.deleted",
            "payload": {
                "board_id": str(board.id),
                "deleted_by": str(current_user.id),
            },
        },
    )

    db.delete(board)
    db.commit()
