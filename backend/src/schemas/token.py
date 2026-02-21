from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None


class GoogleAuthRequest(BaseModel):
    code: str


class GoogleAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
