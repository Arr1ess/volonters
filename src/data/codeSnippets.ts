// ============================================================
// DOCKER COMPOSE
// ============================================================
export const dockerCompose = `version: "3.9"

services:
  # ─── 1. PostgreSQL Database ───
  db:
    image: postgres:16-alpine
    container_name: volunteer_db
    restart: always
    environment:
      POSTGRES_DB: volunteer_cards
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: \${DB_PASSWORD:-secret123}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - backend_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d volunteer_cards"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ─── 2. FastAPI Backend ───
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: volunteer_backend
    restart: always
    environment:
      DATABASE_URL: postgresql+asyncpg://admin:\${DB_PASSWORD:-secret123}@db:5432/volunteer_cards
      JWT_SECRET: \${JWT_SECRET:-my-super-secret-key}
      JWT_ALGORITHM: HS256
      ACCESS_TOKEN_EXPIRE_MINUTES: 60
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - backend_net
      - frontend_net
    volumes:
      - ./backend:/app

  # ─── 3. Frontend Admin ───
  frontend-admin:
    build:
      context: ./frontend-admin
      dockerfile: Dockerfile
    container_name: volunteer_admin
    restart: always
    environment:
      VITE_API_URL: http://backend:8000
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - frontend_net

  # ─── 4. Frontend Volunteer ───
  frontend-volunteer:
    build:
      context: ./frontend-volunteer
      dockerfile: Dockerfile
    container_name: volunteer_app
    restart: always
    environment:
      VITE_API_URL: http://backend:8000
    ports:
      - "3001:80"
    depends_on:
      - backend
    networks:
      - frontend_net

  # ─── 5. Frontend Partner ───
  frontend-partner:
    build:
      context: ./frontend-partner
      dockerfile: Dockerfile
    container_name: volunteer_partner
    restart: always
    environment:
      VITE_API_URL: http://backend:8000
    ports:
      - "3002:80"
    depends_on:
      - backend
    networks:
      - frontend_net

volumes:
  pgdata:
    driver: local

networks:
  backend_net:
    driver: bridge
  frontend_net:
    driver: bridge
`;

// ============================================================
// DATABASE MODELS
// ============================================================
export const dbModels = `"""
app/models.py — SQLAlchemy модели для системы цифровых карт волонтеров
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, Boolean, Enum, ForeignKey, Text
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
    role = Column(
        Enum("admin", "volunteer", "partner", name="user_role"),
        nullable=False,
        default="volunteer"
    )
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
        nullable=False
    )
    full_name = Column(String(255), nullable=False)
    passport_data = Column(String(255), nullable=False)  # Серия и номер
    card_id = Column(
        String(50),
        unique=True,
        nullable=False,
        default=lambda: f"VC-{uuid.uuid4().hex[:12].upper()}"
    )
    expiration_date = Column(DateTime, nullable=False)
    status = Column(
        Enum("active", "expired", "suspended", "revoked", name="card_status"),
        nullable=False,
        default="active"
    )
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
        nullable=False
    )
    partner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    is_valid = Column(Boolean, nullable=False)
    reason = Column(String(255), nullable=True)
    verified_at = Column(DateTime, default=datetime.utcnow)

    volunteer = relationship("Volunteer", back_populates="verification_logs")
`;

export const dbInitSQL = `-- db/init.sql
-- Инициализация БД при первом запуске контейнера

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'volunteer'
        CHECK (role IN ('admin', 'volunteer', 'partner')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица волонтеров
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    passport_data VARCHAR(255) NOT NULL,
    card_id VARCHAR(50) UNIQUE NOT NULL,
    expiration_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'suspended', 'revoked')),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Лог проверок
CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_valid BOOLEAN NOT NULL,
    reason VARCHAR(255),
    verified_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_volunteers_card_id ON volunteers(card_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);
CREATE INDEX IF NOT EXISTS idx_volunteers_expiration ON volunteers(expiration_date);
CREATE INDEX IF NOT EXISTS idx_verification_volunteer ON verification_logs(volunteer_id);

-- Дефолтный админ (пароль: admin123 — bcrypt hash)
INSERT INTO users (email, hashed_password, full_name, role)
VALUES (
    'admin@volunteer.ru',
    '$2b$12$LJ3m4ys1Lp0bMHZbJGqFYeJqA7xKqG5rT8vN2cW1mE9kO3hF6dS5u',
    'Системный Администратор',
    'admin'
) ON CONFLICT (email) DO NOTHING;
`;

// ============================================================
// BACKEND - MAIN APP
// ============================================================
export const backendMain = `"""
app/main.py — Точка входа FastAPI приложения
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, admin, volunteer, partner

app = FastAPI(
    title="Система цифровых карт волонтеров",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS — разрешаем запросы от всех фронтендов
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Admin
        "http://localhost:3001",  # Volunteer
        "http://localhost:3002",  # Partner
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(auth.router, prefix="/api/auth", tags=["Авторизация"])
app.include_router(admin.router, prefix="/api/admin", tags=["Админ"])
app.include_router(volunteer.router, prefix="/api/volunteer", tags=["Волонтер"])
app.include_router(partner.router, prefix="/api/partner", tags=["Партнер"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "volunteer-cards-api"}
`;

// ============================================================
// BACKEND - DATABASE
// ============================================================
export const backendDatabase = `"""
app/database.py — Подключение к PostgreSQL
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://admin:secret123@localhost:5432/volunteer_cards"
)

engine = create_async_engine(DATABASE_URL, echo=False, pool_size=20, max_overflow=10)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """Dependency: получить сессию БД"""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
`;

// ============================================================
// BACKEND - AUTH
// ============================================================
export const backendAuth = `"""
app/routers/auth.py — JWT авторизация
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os

from app.database import get_db
from app.models import User
from app.schemas import Token, UserResponse

router = APIRouter()

# Конфигурация
SECRET_KEY = os.getenv("JWT_SECRET", "my-super-secret-key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency: извлечь текущего пользователя из JWT"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Недействительные учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_role(role: str):
    """Dependency: проверка роли пользователя"""
    async def role_checker(user: User = Depends(get_current_user)):
        if user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Требуется роль: {role}"
            )
        return user
    return role_checker


@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Авторизация пользователя"""
    result = await db.execute(select(User).where(User.email == form.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Аккаунт деактивирован")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Получить данные текущего пользователя"""
    return user
`;

// ============================================================
// BACKEND - ADMIN ROUTER
// ============================================================
export const backendAdmin = `"""
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
    VolunteerExtend, PaginatedResponse
)
from app.routers.auth import require_role, hash_password

router = APIRouter()


@router.post("/volunteers", response_model=VolunteerResponse, status_code=201)
async def create_volunteer(
    data: VolunteerCreate,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
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
        role="volunteer"
    )
    db.add(user)
    await db.flush()

    # Создаем запись волонтера
    volunteer = Volunteer(
        user_id=user.id,
        full_name=data.full_name,
        passport_data=data.passport_data,
        expiration_date=datetime.utcnow() + timedelta(days=365),
        status="active"
    )
    db.add(volunteer)
    await db.flush()
    await db.refresh(volunteer)
    return volunteer


@router.put("/volunteers/{volunteer_id}", response_model=VolunteerResponse)
async def update_volunteer(
    volunteer_id: UUID,
    data: VolunteerUpdate,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
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
    db: AsyncSession = Depends(get_db)
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
        "pages": (total + per_page - 1) // per_page
    }


@router.get("/volunteers/{volunteer_id}", response_model=VolunteerResponse)
async def get_volunteer(
    volunteer_id: UUID,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    """Получить данные конкретного волонтера"""
    result = await db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
    volunteer = result.scalar_one_or_none()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Волонтер не найден")
    return volunteer


@router.post("/volunteers/{volunteer_id}/extend", response_model=VolunteerResponse)
async def extend_card(
    volunteer_id: UUID,
    data: VolunteerExtend,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Продление карты волонтера.
    data.months — на сколько месяцев продлить (от текущей даты или от даты истечения).
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
`;

// ============================================================
// BACKEND - VOLUNTEER ROUTER
// ============================================================
export const backendVolunteer = `"""
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
from app.routers.auth import get_current_user

router = APIRouter()


@router.get("/my-card", response_model=VolunteerResponse)
async def get_my_card(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
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
    db: AsyncSession = Depends(get_db)
):
    """
    Генерация QR-кода для карты волонтера.
    QR содержит JSON с ID волонтера для быстрой проверки.
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

    return StreamingResponse(buffer, media_type="image/png",
        headers={"Content-Disposition": f"inline; filename=qr_{volunteer.card_id}.png"})


@router.get("/qr-code/base64", response_model=QRCodeResponse)
async def get_qr_code_base64(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
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
`;

// ============================================================
// BACKEND - PARTNER ROUTER
// ============================================================
export const backendPartner = `"""
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
from app.routers.auth import get_current_user, require_role

router = APIRouter()


@router.post("/verify-qr", response_model=QRVerifyResponse)
async def verify_qr_code(
    data: QRVerifyRequest,
    partner: User = Depends(require_role("partner")),
    db: AsyncSession = Depends(get_db)
):
    """
    Проверка QR-кода волонтера.
    Принимает строку из QR и возвращает статус валидности.
    """
    # Парсим данные QR
    qr_data = data.qr_data.strip()
    if not qr_data.startswith("VOLUNTEER_CARD:"):
        # Логируем невалидную попытку
        log = VerificationLog(
            volunteer_id=None,
            partner_id=partner.id,
            is_valid=False,
            reason="Неверный формат QR-кода"
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
        return QRVerifyResponse(is_valid=False, reason="Волонтер не найден")

    # Проверяем статус
    if volunteer.status != "active":
        log = VerificationLog(
            volunteer_id=volunteer.id,
            partner_id=partner.id,
            is_valid=False,
            reason=f"Статус карты: {volunteer.status}"
        )
        db.add(log)
        return QRVerifyResponse(
            is_valid=False,
            reason=f"Карта неактивна (статус: {volunteer.status})",
            volunteer_name=volunteer.full_name
        )

    # Проверяем срок действия
    if volunteer.expiration_date < datetime.utcnow():
        # Автоматически обновляем статус
        volunteer.status = "expired"
        log = VerificationLog(
            volunteer_id=volunteer.id,
            partner_id=partner.id,
            is_valid=False,
            reason="Срок действия карты истек"
        )
        db.add(log)
        return QRVerifyResponse(
            is_valid=False,
            reason="Срок действия карты истек",
            volunteer_name=volunteer.full_name
        )

    # Всё валидно
    log = VerificationLog(
        volunteer_id=volunteer.id,
        partner_id=partner.id,
        is_valid=True
    )
    db.add(log)

    return QRVerifyResponse(
        is_valid=True,
        volunteer_name=volunteer.full_name,
        card_id=volunteer.card_id,
        expiration_date=volunteer.expiration_date
    )


@router.get("/volunteer/{volunteer_id}", response_model=VolunteerPublicResponse)
async def get_volunteer_public(
    volunteer_id: UUID,
    partner: User = Depends(require_role("partner")),
    db: AsyncSession = Depends(get_db)
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
            volunteer.status == "active" and
            volunteer.expiration_date > datetime.utcnow()
        )
    )
`;

// ============================================================
// BACKEND - SCHEMAS
// ============================================================
export const backendSchemas = `"""
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
    passport_data: str = Field(..., pattern=r"^\\d{4}\\s\\d{6}$")  # Формат: 1234 567890


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
`;

// ============================================================
// BACKEND - REQUIREMENTS
// ============================================================
export const backendRequirements = `# requirements.txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy[asyncio]==2.0.25
asyncpg==0.29.0
pydantic[email]==2.5.3
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
qrcode[pil]==7.4.2
Pillow==10.2.0
alembic==1.13.1
`;

export const backendDockerfile = `# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Системные зависимости для Pillow и qrcode
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc libpq-dev && \\
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
`;

// ============================================================
// FRONTEND ADMIN
// ============================================================
export const frontendAdminApp = `// frontend-admin/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VolunteerList from './pages/VolunteerList';
import VolunteerCreate from './pages/VolunteerCreate';
import VolunteerEdit from './pages/VolunteerEdit';
import Layout from './components/Layout';

// Защищенный роут
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Загрузка...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="volunteers" element={<VolunteerList />} />
            <Route path="volunteers/new" element={<VolunteerCreate />} />
            <Route path="volunteers/:id/edit" element={<VolunteerEdit />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
`;

export const frontendAdminAuthContext = `// frontend-admin/src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
      api.get('/api/auth/me')
        .then(res => setUser(res.data))
        .catch(() => { setToken(null); localStorage.removeItem('token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const res = await api.post('/api/auth/login', formData);
    const newToken = res.data.access_token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    api.defaults.headers.common['Authorization'] = \`Bearer \${newToken}\`;
    const userRes = await api.get('/api/auth/me');
    setUser(userRes.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
`;

// ============================================================
// FRONTEND VOLUNTEER
// ============================================================
export const frontendVolunteerApp = `// frontend-volunteer/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import MyCard from './pages/MyCard';
import QRCode from './pages/QRCode';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Загрузка...</div>;
  if (!user || user.role !== 'volunteer') return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<MyCard />} />
            <Route path="qr" element={<QRCode />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
`;

// ============================================================
// FRONTEND PARTNER
// ============================================================
export const frontendPartnerApp = `// frontend-partner/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ScanQR from './pages/ScanQR';
import CheckManual from './pages/CheckManual';
import History from './pages/History';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Загрузка...</div>;
  if (!user || user.role !== 'partner') return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<ScanQR />} />
            <Route path="manual" element={<CheckManual />} />
            <Route path="history" element={<History />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
`;

export const frontendPartnerScanQR = `// frontend-partner/src/pages/ScanQR.tsx
import { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import api from '../services/api';

interface VerifyResult {
  is_valid: boolean;
  reason?: string;
  volunteer_name?: string;
  card_id?: string;
  expiration_date?: string;
}

export default function ScanQR() {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  const handleScan = async (data: string | undefined) => {
    if (!data || !scanning) return;
    setScanning(false);
    setError(null);

    try {
      const res = await api.post('/api/partner/verify-qr', { qr_data: data });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка проверки');
    } finally {
      setTimeout(() => setScanning(true), 3000);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Сканирование QR-кода</h1>

      <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
        <QrReader
          onResult={(result) => {
            if (result?.getText()) handleScan(result.getText());
          }}
          constraints={{ facingMode: 'environment' }}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className={\`rounded-lg p-4 border \${
          result.is_valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }\`}>
          <div className="text-3xl mb-2">{result.is_valid ? '✅' : '❌'}</div>
          <h2 className={\`text-lg font-bold \${
            result.is_valid ? 'text-green-800' : 'text-red-800'
          }\`}>
            {result.is_valid ? 'Карта действительна' : 'Карта недействительна'}
          </h2>
          {result.volunteer_name && <p className="mt-1">Волонтер: {result.volunteer_name}</p>}
          {result.card_id && <p className="text-sm text-gray-600">ID: {result.card_id}</p>}
          {result.reason && <p className="text-sm mt-1">{result.reason}</p>}
          {result.expiration_date && (
            <p className="text-sm text-gray-600">
              Действует до: {new Date(result.expiration_date).toLocaleDateString('ru-RU')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
`;

// ============================================================
// FRONTEND DOCKERFILES
// ============================================================
export const frontendDockerfile = `# frontend-admin/Dockerfile (аналогично для volunteer и partner)
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;

export const nginxConf = `# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing — все запросы на index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Проксирование API на backend
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Кеширование статики
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
`;
