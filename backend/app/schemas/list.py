from uuid import UUID

from pydantic import BaseModel


class ListBase(BaseModel):
    title: str


class ListCreate(ListBase):
    pass


class ListUpdate(BaseModel):
    title: str | None = None
    position: int | None = None


class ListOut(ListBase):
    id: UUID
    position: int
    board_id: UUID

    class Config:
        from_attributes = True
