"""
app/routers/volunteer.py — Эндпоинты для волонтера
"""
import io
import base64
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import qrcode

from app.database import get_db
from app.models import User, Volunteer
from app.schemas import VolunteerResponse, QRCodeResponse
from app.auth import get_current_user

router = APIRouter()


@router.get("/my-card", response_model=VolunteerResponse)
async def get_my_card(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получить данные своей карты волонтера"""
    if user.role != "volunteer":
        raise HTTPException(status_code=403, detail="Доступ только для волонтеров")

    result = await db.execute(select(Volunteer).where(Volunteer.user_id == user.id))
    volunteer = result.scalar_one_or_none()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Карта волонтера не найдена")
    return volunteer


@router.get("/qr-code")
async def get_qr_code(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Генерация QR-кода для карты волонтера.
    QR содержит строку VOLUNTEER_CARD:<uuid> для быстрой проверки.
    """
    if user.role != "volunteer":
        raise HTTPException(status_code=403, detail="Доступ только для волонтеров")

    result = await db.execute(select(Volunteer).where(Volunteer.user_id == user.id))
    volunteer = result.scalar_one_or_none()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Карта не найдена")

    if volunteer.status != "active":
        raise HTTPException(status_code=400, detail=f"Карта неактивна: {volunteer.status}")

    # Генерируем QR-код
    qr_data = f"VOLUNTEER_CARD:{volunteer.id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # Сохраняем в buffer
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={"Content-Disposition": f"inline; filename=qr_{volunteer.card_id}.png"},
    )


@router.get("/qr-code/base64", response_model=QRCodeResponse)
async def get_qr_code_base64(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Получить QR-код в формате base64 (для встраивания в фронтенд)"""
    if user.role != "volunteer":
        raise HTTPException(status_code=403, detail="Доступ только для волонтеров")

    result = await db.execute(select(Volunteer).where(Volunteer.user_id == user.id))
    volunteer = result.scalar_one_or_none()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Карта не найдена")

    qr_data = f"VOLUNTEER_CARD:{volunteer.id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()

    return {"qr_base64": f"data:image/png;base64,{qr_base64}", "card_id": volunteer.card_id}
