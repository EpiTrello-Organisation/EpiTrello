import uuid

from sqlalchemy import Column, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class CardMember(Base):
    __tablename__ = "card_members"
    __table_args__ = (
        UniqueConstraint("card_id", "user_id", name="uq_card_members_card_user"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    card_id = Column(
        UUID(as_uuid=True), ForeignKey("cards.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    card = relationship("Card", back_populates="members")
    user = relationship("User", back_populates="assigned_cards")
