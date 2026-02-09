from uuid import UUID

from pydantic import BaseModel, EmailStr


class BoardMemberAddByEmail(BaseModel):
    email: EmailStr


class BoardMemberRemoveByEmail(BaseModel):
    email: EmailStr


class BoardMemberOut(BaseModel):
    user_id: UUID
    email: EmailStr
    username: str
    role: str
