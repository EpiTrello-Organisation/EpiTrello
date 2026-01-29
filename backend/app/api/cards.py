from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.models.card import Card
from app.models.list import List
from app.models.board_member import BoardMember
from app.models.user import User
from app.schemas.card import CardCreate, CardUpdate, CardOut

router = APIRouter(prefix="/cards", tags=["Cards"])

@router.post("/", response_model=CardOut, status_code=status.HTTP_201_CREATED)
def create_card(
    list_id: UUID,
    card_in: CardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    list_ = db.query(List).filter(List.id == list_id).first()
    if not list_:
        raise HTTPException(status_code=404, detail="List not found")

    is_member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == list_.board_id,
            BoardMember.user_id == current_user.id,
        )
        .first()
    )
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized")

    last_card = (
        db.query(Card)
        .filter(Card.list_id == list_id)
        .order_by(Card.position.desc())
        .first()
    )

    position = last_card.position + 1 if last_card else 0

    card = Card(
        title=card_in.title,
        description=card_in.description,
        list_id=list_id,
        creator_id=current_user.id,
        position=position,
    )

    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.get("/", response_model=list[CardOut])
def list_cards(
    list_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    list_ = db.query(List).filter(List.id == list_id).first()
    if not list_:
        raise HTTPException(status_code=404, detail="List not found")

    is_member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == list_.board_id,
            BoardMember.user_id == current_user.id,
        )
        .first()
    )
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized")

    return (
        db.query(Card)
        .filter(Card.list_id == list_id)
        .order_by(Card.position)
        .all()
    )

@router.put("/{card_id}", response_model=CardOut)
def update_card(
    card_id: UUID,
    card_in: CardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    list_ = card.list
    is_member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == list_.board_id,
            BoardMember.user_id == current_user.id,
        )
        .first()
    )
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized")

    if card_in.title is not None:
        card.title = card_in.title
    if card_in.description is not None:
        card.description = card_in.description
    if card_in.position is not None:
        card.position = card_in.position

    db.commit()
    db.refresh(card)
    return card


@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
    card_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    list_ = card.list
    is_member = (
        db.query(BoardMember)
        .filter(
            BoardMember.board_id == list_.board_id,
            BoardMember.user_id == current_user.id,
        )
        .first()
    )
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(card)
    db.commit()
