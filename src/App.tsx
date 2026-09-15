import { useState } from 'react';

type Tab = 'structure' | 'docker' | 'backend' | 'frontend' | 'run';

export default function App() {
  const [tab, setTab] = useState<Tab>('structure');

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎫</span>
            <h1 className="text-2xl font-bold">Система цифровых карт волонтеров</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Полный проект: PostgreSQL + FastAPI + 3 React-приложения + Docker
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {[
            { id: 'structure' as Tab, label: '📁 Структура' },
            { id: 'docker' as Tab, label: '🐳 Docker' },
            { id: 'backend' as Tab, label: '⚡ Backend' },
            { id: 'frontend' as Tab, label: '⚛️ Frontend' },
            { id: 'run' as Tab, label: '🚀 Запуск' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {tab === 'structure' && <StructureTab />}
        {tab === 'docker' && <DockerTab />}
        {tab === 'backend' && <BackendTab />}
        {tab === 'frontend' && <FrontendTab />}
        {tab === 'run' && <RunTab />}
      </main>
    </div>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? '✓' : 'copy'}
      </button>
      <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed">
        <code className={`language-${lang}`}>{code}</code>
      </pre>
    </div>
  );
}

function StructureTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">📁 Полная структура проекта</h2>
        <p className="text-gray-400 text-sm mb-4">
          Все файлы уже созданы в репозитории. Скопируйте их в свой проект.
        </p>
        <CodeBlock lang="text" code={`volonters/
├── docker-compose.yml          # Оркестрация 5 контейнеров
├── init.sql                    # SQL инициализация БД
├── .env.example                # Пример переменных окружения
├── .gitignore
├── package.json                # (этот файл — корневой dev-проект)
│
├── backend/                    # ─── FastAPI Backend ───
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # Точка входа, CORS, роутеры
│       ├── database.py         # Async SQLAlchemy + PostgreSQL
│       ├── models.py           # User, Volunteer, VerificationLog
│       ├── schemas.py          # Pydantic схемы
│       ├── auth.py             # JWT, зависимости ролей
│       └── routers/
│           ├── auth.py         # POST /login, GET /me
│           ├── admin.py        # CRUD волонтеров, продление
│           ├── volunteer.py    # GET карта, QR-код
│           └── partner.py      # POST verify-qr, GET волонтер
│
├── frontend/
│   ├── admin/                  # ─── Admin Panel (React) ───
│   │   ├── Dockerfile
│   │   ├── nginx.conf
│   │   ├── package.json
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── services/api.ts
│   │       ├── context/AuthContext.tsx
│   │       ├── components/ProtectedRoute.tsx
│   │       └── pages/
│   │           ├── Login.tsx
│   │           ├── Dashboard.tsx
│   │           ├── VolunteersList.tsx
│   │           └── CreateVolunteer.tsx
│   │
│   ├── volunteer/              # ─── Volunteer App (React) ───
│   │   ├── Dockerfile
│   │   ├── nginx.conf
│   │   ├── package.json
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── services/api.ts
│   │       ├── context/AuthContext.tsx
│   │       └── pages/
│   │           ├── Login.tsx
│   │           ├── CardView.tsx
│   │           └── QRCode.tsx
│   │
│   └── partner/                # ─── Partner App (React) ───
│       ├── Dockerfile
│       ├── nginx.conf
│       ├── package.json
│       └── src/
│           ├── App.tsx
│           ├── services/api.ts
│           ├── context/AuthContext.tsx
│           └── pages/
│               ├── Login.tsx
│               ├── Scanner.tsx
│               ├── ManualCheck.tsx
│               └── History.tsx
│
└── src/                        # (этот каталог — документация)
    ├── App.tsx
    └── ...`} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">🏗️ Архитектура</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-950/40 border border-blue-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">🛡️</div>
            <div className="font-semibold text-blue-300">Admin Panel</div>
            <div className="text-xs text-gray-400">React → :3000</div>
            <div className="text-xs text-gray-500 mt-2">CRUD волонтеров, продление карт</div>
          </div>
          <div className="bg-green-950/40 border border-green-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">🧑‍🤝‍🧑</div>
            <div className="font-semibold text-green-300">Volunteer App</div>
            <div className="text-xs text-gray-400">React → :3001</div>
            <div className="text-xs text-gray-500 mt-2">Просмотр карты, QR-код</div>
          </div>
          <div className="bg-purple-950/40 border border-purple-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">🤝</div>
            <div className="font-semibold text-purple-300">Partner App</div>
            <div className="text-xs text-gray-400">React → :3002</div>
            <div className="text-xs text-gray-500 mt-2">Сканирование QR, проверка</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-orange-950/40 border border-orange-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">⚡</div>
            <div className="font-semibold text-orange-300">FastAPI Backend</div>
            <div className="text-xs text-gray-400">Python → :8000</div>
          </div>
          <div className="bg-cyan-950/40 border border-cyan-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">🐘</div>
            <div className="font-semibold text-cyan-300">PostgreSQL 16</div>
            <div className="text-xs text-gray-400">DB → :5432</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DockerTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">🐳 docker-compose.yml</h2>
        <p className="text-gray-400 text-sm mb-4">
          5 контейнеров: БД, Backend, 3 Frontend-а. Сети backend_net и frontend_net. Volume для данных PostgreSQL.
        </p>
        <CodeBlock lang="yaml" code={`version: "3.9"

services:
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
      - pg/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - backend_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d volunteer_cards"]
      interval: 5s
      timeout: 5s
      retries: 5

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

  frontend-admin:
    build:
      context: ./frontend/admin
      dockerfile: Dockerfile
    container_name: volunteer_admin
    restart: always
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - frontend_net

  frontend-volunteer:
    build:
      context: ./frontend/volunteer
      dockerfile: Dockerfile
    container_name: volunteer_app
    restart: always
    ports:
      - "3001:80"
    depends_on:
      - backend
    networks:
      - frontend_net

  frontend-partner:
    build:
      context: ./frontend/partner
      dockerfile: Dockerfile
    container_name: volunteer_partner
    restart: always
    ports:
      - "3002:80"
    depends_on:
      - backend
    networks:
      - frontend_net

volumes:
  pg

networks:
  backend_net:
    driver: bridge
  frontend_net:
    driver: bridge`} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">.env.example</h2>
        <CodeBlock lang="bash" code={`DB_PASSWORD=secret123
JWT_SECRET=change-me-to-random-64-chars-string-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60`} />
        <p className="text-gray-400 text-sm mt-3">
          Скопируйте в <code className="text-blue-400">.env</code> и измените пароли перед запуском.
        </p>
      </div>
    </div>
  );
}

function BackendTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">⚡ Backend API Endpoints</h2>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Авторизация</h3>
          {[
            { m: 'POST', p: '/api/auth/login', d: 'Получить JWT токен (OAuth2 form)' },
            { m: 'GET', p: '/api/auth/me', d: 'Данные текущего пользователя' },
          ].map(e => (
            <div key={e.p} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${e.m === 'POST' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>{e.m}</span>
              <code className="text-sm text-gray-300">{e.p}</code>
              <span className="text-xs text-gray-500 ml-auto">{e.d}</span>
            </div>
          ))}

          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider pt-4">Админ</h3>
          {[
            { m: 'POST', p: '/api/admin/volunteers', d: 'Создать волонтера' },
            { m: 'PUT', p: '/api/admin/volunteers/:id', d: 'Обновить данные' },
            { m: 'GET', p: '/api/admin/volunteers', d: 'Список (пагинация, фильтры)' },
            { m: 'GET', p: '/api/admin/volunteers/:id', d: 'Данные волонтера' },
            { m: 'DELETE', p: '/api/admin/volunteers/:id', d: 'Удалить волонтера' },
            { m: 'POST', p: '/api/admin/volunteers/:id/extend', d: 'Продлить карту' },
          ].map(e => (
            <div key={e.p + e.m} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                e.m === 'POST' ? 'bg-green-900 text-green-300' : e.m === 'DELETE' ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'
              }`}>{e.m}</span>
              <code className="text-sm text-gray-300">{e.p}</code>
              <span className="text-xs text-gray-500 ml-auto">{e.d}</span>
            </div>
          ))}

          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider pt-4">Волонтер</h3>
          {[
            { m: 'GET', p: '/api/volunteer/my-card', d: 'Данные своей карты' },
            { m: 'GET', p: '/api/volunteer/qr-code', d: 'QR-код (PNG)' },
            { m: 'GET', p: '/api/volunteer/qr-code/base64', d: 'QR в base64' },
          ].map(e => (
            <div key={e.p} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-900 text-blue-300">{e.m}</span>
              <code className="text-sm text-gray-300">{e.p}</code>
              <span className="text-xs text-gray-500 ml-auto">{e.d}</span>
            </div>
          ))}

          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider pt-4">Партнер</h3>
          {[
            { m: 'POST', p: '/api/partner/verify-qr', d: 'Проверить QR-код' },
            { m: 'GET', p: '/api/partner/volunteer/:id', d: 'Публичные данные волонтера' },
          ].map(e => (
            <div key={e.p} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${e.m === 'POST' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>{e.m}</span>
              <code className="text-sm text-gray-300">{e.p}</code>
              <span className="text-xs text-gray-500 ml-auto">{e.d}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">🗄️ Модели БД</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="font-mono text-sm text-cyan-400 mb-2">users</div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• id (UUID PK)</li>
              <li>• email (unique, indexed)</li>
              <li>• hashed_password</li>
              <li>• full_name</li>
              <li>• role (admin|volunteer|partner)</li>
              <li>• is_active</li>
              <li>• created_at, updated_at</li>
            </ul>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="font-mono text-sm text-green-400 mb-2">volunteers</div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• id (UUID PK)</li>
              <li>• user_id (FK → users, unique)</li>
              <li>• full_name</li>
              <li>• passport_data</li>
              <li>• card_id (unique, indexed)</li>
              <li>• expiration_date</li>
              <li>• status (active|expired|...)</li>
            </ul>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="font-mono text-sm text-purple-400 mb-2">verification_logs</div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• id (UUID PK)</li>
              <li>• volunteer_id (FK)</li>
              <li>• partner_id (FK)</li>
              <li>• is_valid</li>
              <li>• reason</li>
              <li>• verified_at</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function FrontendTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-bold text-blue-400 mb-3">🛡️ Admin Panel :3000</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li className="flex items-center gap-2"><span className="text-blue-400">/</span> Dashboard</li>
            <li className="flex items-center gap-2"><span className="text-blue-400">/volunteers</span> Список</li>
            <li className="flex items-center gap-2"><span className="text-blue-400">/volunteers/new</span> Создание</li>
            <li className="flex items-center gap-2"><span className="text-blue-400">/login</span> Вход</li>
          </ul>
          <div className="mt-4 text-xs text-gray-500">
            Функции: CRUD, продление карт, пагинация, поиск
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-bold text-green-400 mb-3">🧑‍🤝‍🧑 Volunteer App :3001</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li className="flex items-center gap-2"><span className="text-green-400">/</span> Моя карта</li>
            <li className="flex items-center gap-2"><span className="text-green-400">/qr</span> QR-код</li>
            <li className="flex items-center gap-2"><span className="text-green-400">/login</span> Вход</li>
          </ul>
          <div className="mt-4 text-xs text-gray-500">
            Функции: просмотр данных карты, генерация QR
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-bold text-purple-400 mb-3">🤝 Partner App :3002</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li className="flex items-center gap-2"><span className="text-purple-400">/</span> Сканирование QR</li>
            <li className="flex items-center gap-2"><span className="text-purple-400">/manual</span> Ручной ввод</li>
            <li className="flex items-center gap-2"><span className="text-purple-400">/history</span> История</li>
            <li className="flex items-center gap-2"><span className="text-purple-400">/login</span> Вход</li>
          </ul>
          <div className="mt-4 text-xs text-gray-500">
            Функции: проверка QR, валидация статуса и срока
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">🔐 Авторизация (JWT)</h2>
        <div className="text-sm text-gray-400 space-y-2">
          <p>• Все 3 фронтенда используют JWT Bearer-токены</p>
          <p>• Токен хранится в localStorage</p>
          <p>• Axios interceptor автоматически добавляет Authorization header</p>
          <p>• При 401 ответе — редирект на /login</p>
          <p>• Роли проверяются на backend через Depends(require_role(...))</p>
        </div>
      </div>
    </div>
  );
}

function RunTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">🚀 Запуск проекта</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">1. Скопируйте файлы</h3>
            <p className="text-sm text-gray-400">
              Все файлы проекта уже созданы в этом репозитории. Если вы клонируете — они будут на месте.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">2. Создайте .env файл</h3>
            <CodeBlock lang="bash" code={`cp .env.example .env
# Отредактируйте пароли!`} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">3. Запустите Docker</h3>
            <CodeBlock lang="bash" code={`# Сборка и запуск всех 5 контейнеров
docker-compose up -d --build

# Проверка статуса
docker-compose ps

# Логи (если что-то не так)
docker-compose logs -f backend`} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">4. Откройте в браузере</h3>
            <div className="space-y-2">
              {[
                { url: 'http://localhost:8000/docs', desc: 'Swagger UI — API документация' },
                { url: 'http://localhost:3000', desc: 'Admin Panel' },
                { url: 'http://localhost:3001', desc: 'Volunteer App' },
                { url: 'http://localhost:3002', desc: 'Partner App' },
              ].map(s => (
                <div key={s.url} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-2">
                  <code className="text-blue-400 text-sm">{s.url}</code>
                  <span className="text-xs text-gray-400 ml-auto">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">5. Остановка</h3>
            <CodeBlock lang="bash" code={`# Остановить контейнеры
docker-compose down

# Остановить + удалить данные БД
docker-compose down -v`} />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">📋 Требования</h2>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>• Docker Desktop / Docker Engine 20.10+</li>
          <li>• Docker Compose v2+</li>
          <li>• 2 GB RAM минимум</li>
          <li>• Порты: 3000, 3001, 3002, 5432, 8000</li>
        </ul>
      </div>

      <div className="bg-blue-950/40 border border-blue-800/50 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4 text-blue-300">💡 Тестовые учетные записи</h2>
        <div className="text-sm text-gray-400 space-y-2">
          <p>После запуска БД автоматически создаст админа:</p>
          <div className="bg-gray-800 rounded-lg p-3 font-mono text-sm">
            <div>Email: <span className="text-blue-400">admin@volunteer.ru</span></div>
            <div>Пароль: <span className="text-blue-400">admin123</span></div>
          </div>
          <p className="mt-3">
            Для создания волонтеров и партнеров используйте Admin Panel или API.
          </p>
        </div>
      </div>
    </div>
  );
}
