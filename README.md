# 🎫 Система цифровых карт волонтеров

Полноценная система управления цифровыми картами волонтеров с 5 Docker-контейнерами.

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Compose                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Admin   │  │ Volunteer│  │ Partner  │  │ Backend  │   │
│  │  :3000   │  │  :3001   │  │  :3002   │  │  :8000   │   │
│  │  React   │  │  React   │  │  React   │  │ FastAPI  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │         │
│       └──────────────┴──────────────┴──────────────┘         │
│                          │                                   │
│                    ┌─────┴─────┐                             │
│                    │ PostgreSQL│                             │
│                    │   :5432   │                             │
│                    └───────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Быстрый старт

### 1. Клонировать репозиторий
```bash
git clone <your-repo-url>
cd volonters
```

### 2. Создать .env файл
```bash
cp .env.example .env
```

Отредактируйте `.env` и измените пароли:
```env
DB_PASSWORD=your_secure_password_here
JWT_SECRET=your_jwt_secret_key_min_32_chars
```

### 3. Запустить Docker
```bash
docker-compose up -d --build
```

### 4. Открыть в браузере
- **Admin Panel:** http://localhost:3000
- **Volunteer App:** http://localhost:3001
- **Partner App:** http://localhost:3002
- **API Docs (Swagger):** http://localhost:8000/docs

## 🔐 Тестовые учетные записи

После первого запуска БД автоматически создаст администратора:

**Email:** `admin@volunteer.ru`  
**Пароль:** `admin123`

Для создания волонтеров и партнеров используйте Admin Panel.

## 📁 Структура проекта

```
volonters/
├── docker-compose.yml              # Оркестрация 5 контейнеров
├── init.sql                        # SQL инициализация БД
├── .env.example                    # Пример переменных окружения
├── README.md                       # Документация
│
├── backend/                        # FastAPI Backend
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py                 # Точка входа
│       ├── database.py             # Async SQLAlchemy
│       ├── models.py               # Модели БД
│       ├── schemas.py              # Pydantic схемы
│       ├── auth.py                 # JWT авторизация
│       └── routers/
│           ├── auth.py             # POST /login, GET /me
│           ├── admin.py            # CRUD волонтеров
│           ├── volunteer.py        # QR-код, карта
│           └── partner.py          # Проверка QR
│
└── frontend/
    ├── admin/                      # Admin Panel (React)
    │   ├── Dockerfile
    │   ├── nginx.conf
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── tsconfig.json
    │   ├── tailwind.config.js
    │   ├── postcss.config.js
    │   ├── index.html
    │   └── src/
    │       ├── main.tsx
    │       ├── App.tsx
    │       ├── index.css
    │       ├── services/api.ts
    │       ├── context/AuthContext.tsx
    │       ├── components/ProtectedRoute.tsx
    │       └── pages/
    │           ├── Login.tsx
    │           ├── Dashboard.tsx
    │           ├── VolunteersList.tsx
    │           └── CreateVolunteer.tsx
    │
    ├── volunteer/                  # Volunteer App (React)
    │   ├── Dockerfile
    │   ├── nginx.conf
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── tsconfig.json
    │   ├── tailwind.config.js
    │   ├── postcss.config.js
    │   ├── index.html
    │   └── src/
    │       ├── main.tsx
    │       ├── App.tsx
    │       ├── index.css
    │       ├── services/api.ts
    │       ├── context/AuthContext.tsx
    │       └── pages/
    │           ├── Login.tsx
    │           ├── CardView.tsx
    │           └── QRCode.tsx
    │
    └── partner/                    # Partner App (React)
        ├── Dockerfile
        ├── nginx.conf
        ├── package.json
        ├── vite.config.js
        ├── tsconfig.json
        ├── tailwind.config.js
        ├── postcss.config.js
        ├── index.html
        └── src/
            ├── main.tsx
            ├── App.tsx
            ├── index.css
            ├── services/api.ts
            ├── context/AuthContext.tsx
            └── pages/
                ├── Login.tsx
                ├── Scanner.tsx
                ├── ManualCheck.tsx
                └── History.tsx
```

## 🔌 API Endpoints

### Авторизация
- `POST /api/auth/login` — Получить JWT токен
- `GET /api/auth/me` — Текущий пользователь

### Админ (требуется роль: admin)
- `POST /api/admin/volunteers` — Создать волонтера
- `PUT /api/admin/volunteers/:id` — Обновить данные
- `GET /api/admin/volunteers` — Список волонтеров (пагинация, фильтры)
- `GET /api/admin/volunteers/:id` — Данные волонтера
- `DELETE /api/admin/volunteers/:id` — Удалить волонтера
- `POST /api/admin/volunteers/:id/extend` — Продлить карту

### Волонтер (требуется роль: volunteer)
- `GET /api/volunteer/my-card` — Данные своей карты
- `GET /api/volunteer/qr-code` — QR-код (PNG image)
- `GET /api/volunteer/qr-code/base64` — QR в base64

### Партнер (требуется роль: partner)
- `POST /api/partner/verify-qr` — Проверить QR-код
- `GET /api/partner/volunteer/:id` — Публичные данные волонтера

## 🗄️ База данных

### Таблицы

**users**
- id (UUID PK)
- email (unique, indexed)
- hashed_password
- full_name
- role (admin|volunteer|partner)
- is_active
- created_at, updated_at

**volunteers**
- id (UUID PK)
- user_id (FK → users, unique)
- full_name
- passport_data
- card_id (unique, indexed)
- expiration_date
- status (active|expired|suspended|revoked)
- created_at, updated_at

**verification_logs**
- id (UUID PK)
- volunteer_id (FK)
- partner_id (FK)
- is_valid
- reason
- verified_at

## 🛠️ Технологии

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (async), PostgreSQL 16
- **Frontend:** React 18, React Router 6, Axios, Tailwind CSS
- **Инфраструктура:** Docker, Docker Compose, Nginx
- **Авторизация:** JWT (OAuth2)
- **QR-коды:** qrcode + Pillow

## 📋 Требования

- Docker Desktop / Docker Engine 20.10+
- Docker Compose v2+
- 2 GB RAM минимум
- Порты: 3000, 3001, 3002, 5432, 8000

## 🔄 Полезные команды

```bash
# Запуск всех контейнеров
docker-compose up -d --build

# Просмотр статуса
docker-compose ps

# Логи backend
docker-compose logs -f backend

# Логи всех сервисов
docker-compose logs -f

# Остановка контейнеров
docker-compose down

# Остановка + удаление данных БД
docker-compose down -v

# Пересборка одного сервиса
docker-compose up -d --build backend
```

## 🐛 Troubleshooting

### Ошибка: "npm ci requires package-lock.json"
**Решение:** Замените `npm ci` на `npm install` в Dockerfile фронтендов (уже исправлено).

### Backend не может подключиться к БД
**Решение:** Проверьте healthcheck БД:
```bash
docker-compose logs db
```
Дождитесь сообщения "database system is ready to accept connections".

### Порт уже занят
**Решение:** Измените порты в `docker-compose.yml` или остановите другой сервис.

### Не могу войти в систему
**Решение:** Проверьте, что БД инициализирована:
```bash
docker-compose exec db psql -U admin -d volunteer_cards -c "SELECT * FROM users;"
```

## 📝 Лицензия

MIT

## 👨‍💻 Разработка

Для локальной разработки без Docker:

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (каждый)
cd frontend/admin
npm install
npm run dev
```

---

**Создано для системы цифровых карт волонтеров** 🎫
