"""
app/models.py — SQLAlchemy модели для системы цифровых карт волонтеров
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, Boolean, ForeignKey, Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    """
    Базовая таблица пользователей.
    Роли: admin, volunteer, partner
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="volunteer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Связь с волонтером (если роль = volunteer)
    volunteer = relationship("Volunteer", back_populates="user", uselist=False)


class Volunteer(Base):
    """
    Таблица волонтеров с данными карты.
    """
    __tablename__ = "volunteers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    full_name = Column(String(255), nullable=False)
    passport_data = Column(String(255), nullable=False)  # Серия и номер
    card_id = Column(
        String(50),
        unique=True,
        nullable=False,
        default=lambda: f"VC-{uuid.uuid4().hex[:12].upper()}",
    )
    expiration_date = Column(DateTime, nullable=False)
    status = Column(String(20), nullable=False, default="active")
    photo_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Связи
    user = relationship("User", back_populates="volunteer")
    verification_logs = relationship("VerificationLog", back_populates="volunteer")


class VerificationLog(Base):
    """
    Лог проверок QR-кодов партнерами.
    """
    __tablename__ = "verification_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    volunteer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("volunteers.id", ondelete="CASCADE"),
        nullable=True,
    )
    partner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_valid = Column(Boolean, nullable=False)
    reason = Column(String(255), nullable=True)
    verified_at = Column(DateTime, default=datetime.utcnow)

    volunteer = relationship("Volunteer", back_populates="verification_logs")
