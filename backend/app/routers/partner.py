"""
app/routers/partner.py — Эндпоинты для партнера
"""
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, Volunteer, VerificationLog
from app.schemas import QRVerifyRequest, QRVerifyResponse, VolunteerPublicResponse
from app.auth import require_role

router = APIRouter()


@router.post("/verify-qr", response_model=QRVerifyResponse)
async def verify_qr_code(
    data: QRVerifyRequest,
    partner: User = Depends(require_role("partner")),
    db: AsyncSession = Depends(get_db),
):
    """
    Проверка QR-кода волонтера.
    Принимает строку из QR и возвращает статус валидности.
    """
    qr_data = data.qr_data.strip()
    if not qr_data.startswith("VOLUNTEER_CARD:"):
        # Логируем невалидную попытку
        log = VerificationLog(
            volunteer_id=None,
            partner_id=partner.id,
            is_valid=False,
            reason="Неверный формат QR-кода",
        )
        db.add(log)
        return QRVerifyResponse(is_valid=False, reason="Неверный формат QR-кода")

    # Извлекаем ID волонтера
    try:
        volunteer_id = UUID(qr_data.split(":", 1)[1])
    except (ValueError, IndexError):
        return QRVerifyResponse(is_valid=False, reason="Некорректные данные QR")

    # Ищем волонтера
    result = await db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
    volunteer = result.scalar_one_or_none()

    if not volunteer:
        log = VerificationLog(
            volunteer_id=None,
            partner_id=partner.id,
            is_valid=False,
            reason="Волонтер не найден",
        )
        db.add(log)
        return QRVerifyResponse(is_valid=False, reason="Волонтер не найден")

    # Проверяем статус
    if volunteer.status != "active":
        log = VerificationLog(
            volunteer_id=volunteer.id,
            partner_id=partner.id,
            is_valid=False,
            reason=f"Статус карты: {volunteer.status}",
        )
        db.add(log)
        return QRVerifyResponse(
            is_valid=False,
            reason=f"Карта неактивна (статус: {volunteer.status})",
            volunteer_name=volunteer.full_name,
        )

    # Проверяем срок действия
    if volunteer.expiration_date < datetime.utcnow():
        volunteer.status = "expired"
        log = VerificationLog(
            volunteer_id=volunteer.id,
            partner_id=partner.id,
            is_valid=False,
            reason="Срок действия карты истек",
        )
        db.add(log)
        return QRVerifyResponse(
            is_valid=False,
            reason="Срок действия карты истек",
            volunteer_name=volunteer.full_name,
        )

    # Всё валидно
    log = VerificationLog(
        volunteer_id=volunteer.id,
        partner_id=partner.id,
        is_valid=True,
    )
    db.add(log)

    return QRVerifyResponse(
        is_valid=True,
        volunteer_name=volunteer.full_name,
        card_id=volunteer.card_id,
        expiration_date=volunteer.expiration_date,
    )


@router.get("/volunteer/{volunteer_id}", response_model=VolunteerPublicResponse)
async def get_volunteer_public(
    volunteer_id: UUID,
    partner: User = Depends(require_role("partner")),
    db: AsyncSession = Depends(get_db),
):
    """
    Получить публичные данные волонтера по ID.
    Не возвращает паспортные данные (только для партнера).
    """
    result = await db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
    volunteer = result.scalar_one_or_none()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Волонтер не найден")

    return VolunteerPublicResponse(
        full_name=volunteer.full_name,
        card_id=volunteer.card_id,
        status=volunteer.status,
        expiration_date=volunteer.expiration_date,
        is_valid=(
            volunteer.status == "active"
            and volunteer.expiration_date > datetime.utcnow()
        ),
    )


@router.get("/volunteer/by-card/{card_id}", response_model=VolunteerPublicResponse)
async def get_volunteer_by_card_id(
    card_id: str,
    partner: User = Depends(require_role("partner")),
    db: AsyncSession = Depends(get_db),
):
    """
    Получить публичные данные волонтера по card_id.
    """
    result = await db.execute(select(Volunteer).where(Volunteer.card_id == card_id))
    volunteer = result.scalar_one_or_none()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Волонтер не найден")

    return VolunteerPublicResponse(
        full_name=volunteer.full_name,
        card_id=volunteer.card_id,
        status=volunteer.status,
        expiration_date=volunteer.expiration_date,
        is_valid=(
            volunteer.status == "active"
            and volunteer.expiration_date > datetime.utcnow()
        ),
    )
