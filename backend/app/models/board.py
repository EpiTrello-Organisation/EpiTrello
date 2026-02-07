from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

class Board(Base):
    __tablename__ = "boards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)

    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="owned_boards")

    created_at = Column(DateTime, default=datetime.utcnow)

    background_kind = Column(String, nullable=False, default="gradient")
    background_value = Column(String, nullable=True)
    background_thumb_url = Column(String, nullable=True)


    members = relationship(
        "BoardMember",
        back_populates="board",
        cascade="all, delete-orphan"
    )

    lists = relationship(
        "List",
        back_populates="board",
        cascade="all, delete-orphan",
        order_by="List.position",
    )

