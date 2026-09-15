"""
app/main.py — Точка входа FastAPI приложения
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, admin, volunteer, partner
from app.database import async_session

app = FastAPI(
    title="Система цифровых карт волонтеров",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — разрешаем запросы от всех фронтендов
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
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


@app.post("/api/setup-admin")
async def setup_admin():
    """Создать администратора по умолчанию (для первого запуска)"""
    from app.auth import hash_password
    from app.models import User
    from sqlalchemy import select
    
    async with async_session() as session:
        # Проверяем, существует ли уже админ
        result = await session.execute(
            select(User).where(User.email == "admin@volunteer.ru")
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            # Обновляем пароль
            existing.hashed_password = hash_password("admin123")
            await session.commit()
            return {"message": "Пароль админа обновлён", "email": "admin@volunteer.ru", "password": "admin123"}
        else:
            # Создаём нового админа
            admin = User(
                email="admin@volunteer.ru",
                hashed_password=hash_password("admin123"),
                full_name="Системный Администратор",
                role="admin",
                is_active=True
            )
            session.add(admin)
            await session.commit()
            return {"message": "Админ создан", "email": "admin@volunteer.ru", "password": "admin123"}
