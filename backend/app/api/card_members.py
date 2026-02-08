# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from uuid import UUID

# from app.api.deps import get_db, get_current_user, require_card_board_member
# from app.models.board_member import BoardMember
# from app.models.card_member import CardMember
# from app.models.user import User
# from app.schemas.card_member import CardMemberAdd, CardMemberOut

# router = APIRouter(prefix="/cards/{card_id}/members", tags=["Card Members"])


# @router.get("/", response_model=list[CardMemberOut])
# def list_card_members(
#     card_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     # autorisé si membre du board du card
#     card, _board_id = require_card_board_member(card_id=card_id, db=db, current_user=current_user)

#     members = db.query(CardMember).filter(CardMember.card_id == card.id).all()
#     return [{"user_id": m.user_id} for m in members]


# @router.post("/", status_code=status.HTTP_201_CREATED)
# def add_card_member(
#     card_id: UUID,
#     payload: CardMemberAdd,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     card, board_id = require_card_board_member(card_id=card_id, db=db, current_user=current_user)

#     # ✅ règle essentielle : on ne peut assigner que quelqu'un qui est membre du board
#     target_is_board_member = (
#         db.query(BoardMember)
#         .filter(
#             BoardMember.board_id == board_id,
#             BoardMember.user_id == payload.user_id,
#         )
#         .first()
#     )
#     if not target_is_board_member:
#         raise HTTPException(status_code=400, detail="User is not a member of this board")

#     exists = (
#         db.query(CardMember)
#         .filter(
#             CardMember.card_id == card.id,
#             CardMember.user_id == payload.user_id,
#         )
#         .first()
#     )
#     if exists:
#         raise HTTPException(status_code=400, detail="User already assigned to this card")

#     cm = CardMember(card_id=card.id, user_id=payload.user_id)
#     db.add(cm)
#     db.commit()
#     return {"detail": "Member assigned to card"}


# @router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
# def remove_card_member(
#     card_id: UUID,
#     user_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     card, _board_id = require_card_board_member(card_id=card_id, db=db, current_user=current_user)

#     cm = (
#         db.query(CardMember)
#         .filter(
#             CardMember.card_id == card.id,
#             CardMember.user_id == user_id,
#         )
#         .first()
#     )
#     if not cm:
#         raise HTTPException(status_code=404, detail="Assignment not found")

#     db.delete(cm)
#     db.commit()
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_db, get_current_user, require_card_board_member
from app.models.board_member import BoardMember
from app.models.card_member import CardMember
from app.models.user import User
from app.schemas.card_member import CardMemberByEmail, CardMemberOut

router = APIRouter(prefix="/cards/{card_id}/members", tags=["Card Members"])


# @router.get("/", response_model=list[CardMemberOut])
# def list_card_members(
#     card_id: UUID,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     card, _board_id = require_card_board_member(card_id=card_id, db=db, current_user=current_user)

#     members = db.query(CardMember).filter(CardMember.card_id == card.id).all()
#     return [{"user_id": m.user_id} for m in members]
@router.get("/", response_model=list[CardMemberOut])
def list_card_members(
    card_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Vérifie que l'utilisateur est membre du board de la card
    card, _board_id = require_card_board_member(
        card_id=card_id,
        db=db,
        current_user=current_user,
    )

    rows = (
        db.query(
            User.id,
            User.email,
            User.username,
        )
        .join(CardMember, CardMember.user_id == User.id)
        .filter(CardMember.card_id == card.id)
        .all()
    )

    return [
        {
            "user_id": row.id,
            "email": row.email,
            "username": row.username,
        }
        for row in rows
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
def add_card_member(
    card_id: UUID,
    payload: CardMemberByEmail,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card, board_id = require_card_board_member(card_id=card_id, db=db, current_user=current_user)

    # 1) retrouver le user par email
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2) vérifier qu'il est membre du board
    target_is_board_member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == board_id,
            BoardMember.user_id == user.id,
        )
        .first()
    )
    if not target_is_board_member:
        raise HTTPException(status_code=400, detail="User is not a member of this board")

    # 3) vérifier qu'il n'est pas déjà assigné
    exists = (
        db.query(CardMember)
        .filter(
            CardMember.card_id == card.id,
            CardMember.user_id == user.id,
        )
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="User already assigned to this card")

    cm = CardMember(card_id=card.id, user_id=user.id)
    db.add(cm)
    db.commit()
    return {"detail": "Member assigned to card"}


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def remove_card_member(
    card_id: UUID,
    payload: CardMemberByEmail,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card, _board_id = require_card_board_member(card_id=card_id, db=db, current_user=current_user)

    # retrouver le user par email
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    cm = (
        db.query(CardMember)
        .filter(
            CardMember.card_id == card.id,
            CardMember.user_id == user.id,
        )
        .first()
    )
    if not cm:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(cm)
    db.commit()
