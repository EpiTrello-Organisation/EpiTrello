import uuid

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class List(Base):
    __tablename__ = "lists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    position = Column(Integer, nullable=False)

    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.id"), nullable=False)

    board = relationship("Board", back_populates="lists")

    cards = relationship(
        "Card",
        back_populates="list",
        cascade="all, delete-orphan",
        order_by="Card.position",
    )
