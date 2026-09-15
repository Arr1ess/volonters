# 🎫 Система цифровых карт волонтеров

Полноценная система управления цифровыми картами волонтеров с 5 Docker-контейнерами.

## Стек

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (async), PostgreSQL 16
- **Frontend:** React 18, React Router 6, Axios
- **Инфраструктура:** Docker, Docker Compose, Nginx
- **Авторизация:** JWT (OAuth2)
- **QR-коды:** qrcode + Pillow

## Контейнеры

| Контейнер | Порт | Описание |
|-----------|------|----------|
| `db` | 5432 | PostgreSQL 16 |
| `backend` | 8000 | FastAPI API |
| `frontend-admin` | 3000 | Панель администратора |
| `frontend-volunteer` | 3001 | Приложение волонтера |
| `frontend-partner` | 3002 | Приложение партнера |

## Быстрый старт

```bash
# 1. Создайте .env
cp .env.example .env

# 2. Запустите
docker-compose up -d --build

# 3. Откройте
# Admin:    http://localhost:3000
# Volunteer: http://localhost:3001
# Partner:  http://localhost:3002
# API Docs: http://localhost:8000/docs
```

## Тестовый аккаунт

- **Email:** admin@volunteer.ru
- **Пароль:** admin123

## API Endpoints

### Авторизация
- `POST /api/auth/login` — Получить JWT
- `GET /api/auth/me` — Текущий пользователь

### Админ
- `POST /api/admin/volunteers` — Создать волонтера
- `PUT /api/admin/volunteers/:id` — Обновить
- `GET /api/admin/volunteers` — Список (пагинация)
- `DELETE /api/admin/volunteers/:id` — Удалить
- `POST /api/admin/volunteers/:id/extend` — Продлить карту

### Волонтер
- `GET /api/volunteer/my-card` — Данные карты
- `GET /api/volunteer/qr-code` — QR-код (PNG)
- `GET /api/volunteer/qr-code/base64` — QR в base64

### Партнер
- `POST /api/partner/verify-qr` — Проверить QR
- `GET /api/partner/volunteer/:id` — Данные волонтера

## Структура

```
├── docker-compose.yml
├── init.sql
├── backend/           # FastAPI
├── frontend/
│   ├── admin/         # React Admin Panel
│   ├── volunteer/     # React Volunteer App
│   └── partner/       # React Partner App
```

## Остановка

```bash
docker-compose down        # Остановить
docker-compose down -v     # + удалить данные БД
```
