from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_board_owner
from app.models.board_member import BoardMember
from app.models.user import User
from app.schemas.board_member import (
    BoardMemberAddByEmail,
    BoardMemberOut,
    BoardMemberRemoveByEmail,
)

router = APIRouter(prefix="/boards/{board_id}/members", tags=["Board Members"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def add_member_by_email(
    board_id: UUID,
    payload: BoardMemberAddByEmail,
    db: Session = Depends(get_db),
    _: BoardMember = Depends(require_board_owner),
):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    exists = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == board_id,
            BoardMember.user_id == user.id,
        )
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="User already member of this board")

    bm = BoardMember(board_id=board_id, user_id=user.id, role="member")
    db.add(bm)
    db.commit()

    return {"detail": "Member added"}


@router.get("/", response_model=list[BoardMemberOut])
def list_members(
    board_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Vérifier que l'utilisateur courant est membre du board
    is_member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == board_id,
            BoardMember.user_id == current_user.id,
        )
        .first()
    )
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized")

    rows = (
        db.query(
            BoardMember.user_id,
            BoardMember.role,
            User.email,
            User.username,
        )
        .join(User, User.id == BoardMember.user_id)
        .filter(BoardMember.board_id == board_id)
        .all()
    )

    return [
        {
            "user_id": row.user_id,
            "email": row.email,
            "username": row.username,
            "role": row.role,
        }
        for row in rows
    ]


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def remove_member_by_email(
    board_id: UUID,
    payload: BoardMemberRemoveByEmail,
    db: Session = Depends(get_db),
    _: BoardMember = Depends(require_board_owner),
):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == board_id,
            BoardMember.user_id == user.id,
        )
        .first()
    )
    if not member:
        raise HTTPException(
            status_code=404, detail="User is not a member of this board"
        )

    if member.role == "owner":
        raise HTTPException(
            status_code=400,
            detail="Cannot remove the board owner",
        )

    db.delete(member)
    db.commit()
