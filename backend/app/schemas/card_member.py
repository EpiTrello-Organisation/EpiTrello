from uuid import UUID

from pydantic import BaseModel, EmailStr


class CardMemberByEmail(BaseModel):
    email: EmailStr


class CardMemberOut(BaseModel):
    user_id: UUID
    email: EmailStr
    username: str
