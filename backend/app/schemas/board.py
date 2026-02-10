from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

BackgroundKind = Literal["gradient", "unsplash"]


class BoardBase(BaseModel):
    title: str


class BoardCreate(BoardBase):
    background_kind: BackgroundKind = "gradient"
    background_value: str | None = None
    background_thumb_url: str | None = None


class BoardOut(BoardBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    created_at: datetime
    background_kind: BackgroundKind
    background_value: str | None = None
    background_thumb_url: str | None = None


class BoardUpdate(BaseModel):
    title: str | None = None
    background_kind: BackgroundKind | None = None
    background_value: str | None = None
    background_thumb_url: str | None = None
