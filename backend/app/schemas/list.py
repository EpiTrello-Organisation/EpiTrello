from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ListBase(BaseModel):
    title: str


class ListCreate(ListBase):
    pass


class ListUpdate(BaseModel):
    title: str | None = None
    position: int | None = None


class ListOut(ListBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    position: int
    board_id: UUID
