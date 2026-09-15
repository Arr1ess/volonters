"""
app/main.py — Точка входа FastAPI приложения
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, admin, volunteer, partner

app = FastAPI(
    title="Система цифровых карт волонтеров",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
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
