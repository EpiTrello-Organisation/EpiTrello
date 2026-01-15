from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class CardBase(BaseModel):
    title: str
    description: str | None = None


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class CardOut(CardBase):
    id: UUID
    position: int
    list_id: UUID
    creator_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
