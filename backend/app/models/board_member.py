from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base

class BoardMember(Base):
    __tablename__ = "board_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    role = Column(String, nullable=False, default="member")

    board = relationship("Board", back_populates="members")
    user = relationship("User", back_populates="boards")
