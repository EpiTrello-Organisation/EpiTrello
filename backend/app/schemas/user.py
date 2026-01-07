from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    username: str

    class Config:
        from_attributes = True
