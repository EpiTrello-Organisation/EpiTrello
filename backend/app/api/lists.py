from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.models.list import List
from app.models.board import Board
from app.models.board_member import BoardMember
from app.models.user import User
from app.schemas.list import ListCreate, ListOut, ListUpdate

router = APIRouter(prefix="/lists", tags=["Lists"])

@router.get("/board/{board_id}", response_model=list[ListOut])
def get_lists(
    board_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_member = db.query(BoardMember).filter(
        BoardMember.board_id == board_id,
        BoardMember.user_id == current_user.id
    ).first()

    if not is_member:
        raise HTTPException(status_code=403, detail="Not a board member")

    return (
        db.query(List)
        .filter(List.board_id == board_id)
        .order_by(List.position)
        .all()
    )

@router.post("/", response_model=ListOut, status_code=status.HTTP_201_CREATED)
def create_list(
    list_in: ListCreate,
    board_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_member = db.query(BoardMember).filter(
        BoardMember.board_id == board_id,
        BoardMember.user_id == current_user.id
    ).first()

    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized")

    max_position = (
        db.query(List.position)
        .filter(List.board_id == board_id)
        .order_by(List.position.desc())
        .first()
    )

    position = (max_position[0] + 1) if max_position else 0

    new_list = List(
        title=list_in.title,
        position=position,
        board_id=board_id,
    )

    db.add(new_list)
    db.commit()
    db.refresh(new_list)

    return new_list

@router.put("/{list_id}", response_model=ListOut)
def update_list(
    list_id: UUID,
    list_in: ListUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lst = db.query(List).filter(List.id == list_id).first()

    if not lst:
        raise HTTPException(status_code=404, detail="List not found")

    is_member = db.query(BoardMember).filter(
        BoardMember.board_id == lst.board_id,
        BoardMember.user_id == current_user.id
    ).first()

    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized")

    if list_in.title is not None:
        lst.title = list_in.title

    if list_in.position is not None:
        lst.position = list_in.position

    db.commit()
    db.refresh(lst)

    return lst

@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_list(
    list_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lst = db.query(List).filter(List.id == list_id).first()

    if not lst:
        raise HTTPException(status_code=404, detail="List not found")

    is_member = db.query(BoardMember).filter(
        BoardMember.board_id == lst.board_id,
        BoardMember.user_id == current_user.id
    ).first()

    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(lst)
    db.commit()
