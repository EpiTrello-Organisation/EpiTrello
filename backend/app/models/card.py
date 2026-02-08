from sqlalchemy import Column, String, ForeignKey, Integer, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class Card(Base):
    __tablename__ = "cards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    position = Column(Integer, nullable=False)

    list_id = Column(UUID(as_uuid=True), ForeignKey("lists.id"), nullable=False)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    list = relationship("List", back_populates="cards")
    creator = relationship("User")

    members = relationship(
        "CardMember",
        back_populates="card",
        cascade="all, delete-orphan",
    )