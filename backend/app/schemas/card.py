from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CardBase(BaseModel):
    title: str
    description: str | None = None


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    position: int | None = None
    list_id: UUID | None = None
    label_ids: list[int] | None = None


class CardOut(CardBase):
    id: UUID
    position: int
    list_id: UUID
    creator_id: UUID
    created_at: datetime
    label_ids: list[int]

    class Config:
        from_attributes = True
