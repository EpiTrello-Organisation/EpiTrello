import uuid

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship


from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    owned_boards = relationship("Board", back_populates="owner")
    boards = relationship("BoardMember", back_populates="user")

    assigned_cards = relationship(
        "CardMember",
        back_populates="user",
        cascade="all, delete-orphan",
    )