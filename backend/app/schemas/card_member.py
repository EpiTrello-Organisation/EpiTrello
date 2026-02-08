from pydantic import BaseModel
from uuid import UUID
from pydantic import EmailStr

class CardMemberByEmail(BaseModel):
    email: EmailStr

class CardMemberOut(BaseModel):
    user_id: UUID
    email: EmailStr
    username: str
