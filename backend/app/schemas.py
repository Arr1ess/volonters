"""
app/schemas.py — Pydantic схемы для валидации данных
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


# ─── Auth ───
class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Volunteer ───
class VolunteerCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=255)
    passport_data: str = Field(..., pattern=r"^\d{4}\s\d{6}$")  # 1234 567890


class VolunteerUpdate(BaseModel):
    full_name: Optional[str] = None
    passport_data: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|suspended|revoked)$")


class VolunteerExtend(BaseModel):
    months: int = Field(..., ge=1, le=36, description="На сколько месяцев продлить")


class VolunteerResponse(BaseModel):
    id: UUID
    user_id: UUID
    full_name: str
    passport_data: str
    card_id: str
    expiration_date: datetime
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VolunteerPublicResponse(BaseModel):
    """Публичные данные волонтера (для партнера — без паспорта)"""
    full_name: str
    card_id: str
    status: str
    expiration_date: datetime
    is_valid: bool


class PaginatedResponse(BaseModel):
    items: List[VolunteerResponse]
    total: int
    page: int
    per_page: int
    pages: int


# ─── QR / Verification ───
class QRCodeResponse(BaseModel):
    qr_base64: str
    card_id: str


class QRVerifyRequest(BaseModel):
    qr_data: str = Field(..., min_length=1, description="Данные из QR-кода")


class QRVerifyResponse(BaseModel):
    is_valid: bool
    reason: Optional[str] = None
    volunteer_name: Optional[str] = None
    card_id: Optional[str] = None
    expiration_date: Optional[datetime] = None
