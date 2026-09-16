"""
app/routers/admin.py — Эндпоинты для администратора
"""
from datetime import datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import User, Volunteer
from app.schemas import (
    VolunteerCreate, VolunteerUpdate, VolunteerResponse,
    VolunteerExtend, PaginatedResponse, UserCreate, UserResponse,
)
from app.auth import require_role, hash_password

router = APIRouter()


@router.post("/volunteers", response_model=VolunteerResponse, status_code=201)
async def create_volunteer(
    data: VolunteerCreate,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """
    Создание нового волонтера.
    Автоматически создает пользователя с ролью volunteer.
    """
    # Проверяем уникальность email
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    # Создаем пользователя
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role="volunteer",
    )
    db.add(user)
    await db.flush()

    # Создаем запись волонтера
    volunteer = Volunteer(
        user_id=user.id,
        full_name=data.full_name,
        passport_data=data.passport_data,
        expiration_date=datetime.utcnow() + timedelta(days=365),
        status="active",
    )
    db.add(volunteer)
    await db.flush()
    await db.refresh(volunteer)
    return volunteer


@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(
    data: UserCreate,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """
    Создание нового пользователя (партнера или волонтера).
    """
    # Проверяем уникальность email
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    # Создаем пользователя
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Получить список всех пользователей"""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return users


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Удалить пользователя"""
    # Нельзя удалить самого себя
    if str(user_id) == str(admin.id):
        raise HTTPException(status_code=400, detail="Нельзя удалить свой аккаунт")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    await db.delete(user)
    await db.flush()
    return {"message": "Пользователь удален"}


@router.put("/volunteers/{volunteer_id}", response_model=VolunteerResponse)
async def update_volunteer(
    volunteer_id: UUID,
    data: VolunteerUpdate,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Обновление данных волонтера"""
    result = await db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
    volunteer = result.scalar_one_or_none()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Волонтер не найден")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(volunteer, field, value)

    volunteer.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(volunteer)
    return volunteer


@router.get("/volunteers", response_model=PaginatedResponse)
async def list_volunteers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    search: str = Query(None),
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Список волонтеров с пагинацией и фильтрацией"""
    query = select(Volunteer)

    if status:
        query = query.where(Volunteer.status == status)
    if search:
        query = query.where(Volunteer.full_name.ilike(f"%{search}%"))

    # Подсчет общего количества
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    # Пагинация
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }


@router.get("/volunteers/{volunteer_id}", response_model=VolunteerResponse)
async def get_volunteer(
    volunteer_id: UUID,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Получить данные конкретного волонтера"""
    result = await db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
    volunteer = result.scalar_one_or_none()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Волонтер не найден")
    return volunteer


@router.post("/volunteers/{volunteer_id}/deactivate", response_model=VolunteerResponse)
async def deactivate_volunteer(
    volunteer_id: UUID,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Отключить волонтера (изменить статус на suspended)"""
    result = await db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
    volunteer = result.scalar_one_or_none()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Волонтер не найден")

    volunteer.status = "suspended"
    volunteer.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(volunteer)
    return volunteer


@router.post("/volunteers/{volunteer_id}/activate", response_model=VolunteerResponse)
async def activate_volunteer(
    volunteer_id: UUID,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Активировать волонтера (изменить статус на active)"""
    result = await db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
    volunteer = result.scalar_one_or_none()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Волонтер не найден")

    volunteer.status = "active"
    volunteer.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(volunteer)
    return volunteer


@router.post("/volunteers/{volunteer_id}/extend", response_model=VolunteerResponse)
async def extend_card(
    volunteer_id: UUID,
    data: VolunteerExtend,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """
    Продление карты волонтера.
    data.months — на сколько месяцев продлить.
    """
    result = await db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
    volunteer = result.scalar_one_or_none()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Волонтер не найден")

    # Продлеваем от максимальной даты (текущей или даты истечения)
    base_date = max(volunteer.expiration_date, datetime.utcnow())
    volunteer.expiration_date = base_date + timedelta(days=30 * data.months)
    volunteer.status = "active"
    volunteer.updated_at = datetime.utcnow()

    await db.flush()
    await db.refresh(volunteer)
    return volunteer
