from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
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
def create_board(
    board_in: BoardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = Board(
        title=board_in.title,
        owner_id=current_user.id,
        background_kind=board_in.background_kind,
        background_value=board_in.background_value,
        background_thumb_url=board_in.background_thumb_url,
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
                BoardMember.board_id == board.id, BoardMember.user_id == current_user.id
            )
            .first()
        )
        if not membership:
            raise HTTPException(status_code=403, detail="Not authorized")

    return board


@router.put("/{board_id}", response_model=BoardOut)
def update_board(
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

    if board_in.title is not None:
        board.title = board_in.title
    if board_in.background_kind is not None:
        board.background_kind = board_in.background_kind
    if board_in.background_value is not None:
        board.background_value = board_in.background_value
    if board_in.background_thumb_url is not None:
        board.background_thumb_url = board_in.background_thumb_url

    db.commit()
    db.refresh(board)
    return board


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(
    board_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = db.query(Board).filter(Board.id == board_id).first()

    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(board)
    db.commit()
