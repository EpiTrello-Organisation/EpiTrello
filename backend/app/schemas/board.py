from pydantic import BaseModel
from typing import Literal, Optional
from uuid import UUID
from datetime import datetime

BackgroundKind = Literal["gradient", "unsplash"]

class BoardBase(BaseModel):
    title: str

class BoardCreate(BoardBase):
    background_kind: BackgroundKind = "gradient"
    background_value: Optional[str] = None
    background_thumb_url: Optional[str] = None

class BoardOut(BoardBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    background_kind: BackgroundKind
    background_value: Optional[str] = None
    background_thumb_url: Optional[str] = None

    class Config:
        from_attributes = True

class BoardUpdate(BaseModel):
    title: str | None = None
    background_kind: BackgroundKind | None = None
    background_value: str | None = None
    background_thumb_url: str | None = None
