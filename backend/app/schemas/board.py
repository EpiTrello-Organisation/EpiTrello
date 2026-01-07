from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class BoardBase(BaseModel):
    title: str

class BoardCreate(BoardBase):
    pass

class BoardOut(BoardBase):
    id: UUID
    owner_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class BoardUpdate(BaseModel):
    title: str
