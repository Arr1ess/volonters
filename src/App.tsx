import { useState } from 'react';
import CodeBlock from './components/CodeBlock';
import {
  dockerCompose,
  dbModels,
  dbInitSQL,
  backendMain,
  backendDatabase,
  backendAuth,
  backendAdmin,
  backendVolunteer,
  backendPartner,
  backendSchemas,
  backendRequirements,
  backendDockerfile,
  frontendAdminApp,
  frontendAdminAuthContext,
  frontendVolunteerApp,
  frontendPartnerApp,
  frontendPartnerScanQR,
  frontendDockerfile,
  nginxConf,
} from './data/codeSnippets';

type Section =
  | 'overview'
  | 'docker'
  | 'database'
  | 'backend-main'
  | 'backend-auth'
  | 'backend-admin'
  | 'backend-volunteer'
  | 'backend-partner'
  | 'backend-schemas'
  | 'frontend-admin'
  | 'frontend-volunteer'
  | 'frontend-partner'
  | 'instructions';

const sections: { id: Section; label: string; group: string }[] = [
  { id: 'overview', label: 'Архитектура', group: 'Общее' },
  { id: 'docker', label: 'Docker Compose', group: 'Инфраструктура' },
  { id: 'database', label: 'Модели БД', group: 'Backend' },
  { id: 'backend-main', label: 'FastAPI App', group: 'Backend' },
  { id: 'backend-auth', label: 'Авторизация (JWT)', group: 'Backend' },
  { id: 'backend-admin', label: 'API Админа', group: 'Backend' },
  { id: 'backend-volunteer', label: 'API Волонтера', group: 'Backend' },
  { id: 'backend-partner', label: 'API Партнера', group: 'Backend' },
  { id: 'backend-schemas', label: 'Pydantic Schemas', group: 'Backend' },
  { id: 'frontend-admin', label: 'Admin Panel', group: 'Frontend' },
  { id: 'frontend-volunteer', label: 'Volunteer App', group: 'Frontend' },
  { id: 'frontend-partner', label: 'Partner App', group: 'Frontend' },
  { id: 'instructions', label: 'Запуск', group: 'Общее' },
];

export default function App() {
  const [active, setActive] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const groups = [...new Set(sections.map((s) => s.group))];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-gray-900 border-r border-gray-800 overflow-y-auto z-40 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🎫</span>
            <span>ВолонтерКарты</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Система цифровых карт v1.0</p>
        </div>

        <nav className="p-3">
          {groups.map((group) => (
            <div key={group} className="mb-4">
              <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold px-3 mb-1">
                {group}
              </h3>
              {sections
                .filter((s) => s.group === group)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActive(s.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      active === s.id
                        ? 'bg-blue-600/20 text-blue-400 font-medium'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-medium text-sm">
            {sections.find((s) => s.id === active)?.label}
          </span>
        </div>

        <div className="max-w-5xl mx-auto p-6 lg:p-10">
          {active === 'overview' && <OverviewSection />}
          {active === 'docker' && <DockerSection />}
          {active === 'database' && <DatabaseSection />}
          {active === 'backend-main' && <BackendMainSection />}
          {active === 'backend-auth' && <BackendAuthSection />}
          {active === 'backend-admin' && <BackendAdminSection />}
          {active === 'backend-volunteer' && <BackendVolunteerSection />}
          {active === 'backend-partner' && <BackendPartnerSection />}
          {active === 'backend-schemas' && <BackendSchemasSection />}
          {active === 'frontend-admin' && <FrontendAdminSection />}
          {active === 'frontend-volunteer' && <FrontendVolunteerSection />}
          {active === 'frontend-partner' && <FrontendPartnerSection />}
          {active === 'instructions' && <InstructionsSection />}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// SECTIONS
// ============================================================

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-white">{title}</h2>
      <p className="text-gray-400 mt-2">{subtitle}</p>
    </div>
  );
}

function OverviewSection() {
  return (
    <div>
      <SectionHeader
        title="Архитектура системы"
        subtitle="5 Docker-контейнеров для управления цифровыми картами волонтеров"
      />

      {/* Architecture diagram */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-center">Схема взаимодействия</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-950/50 border border-blue-800/50 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">🛡️</div>
            <div className="font-semibold text-blue-300">Admin Panel</div>
            <div className="text-xs text-gray-400 mt-1">React • :3000</div>
            <div className="text-xs text-gray-500 mt-2">Управление волонтерами, продление карт</div>
          </div>
          <div className="bg-green-950/50 border border-green-800/50 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">🧑‍🤝‍🧑</div>
            <div className="font-semibold text-green-300">Volunteer App</div>
            <div className="text-xs text-gray-400 mt-1">React • :3001</div>
            <div className="text-xs text-gray-500 mt-2">Просмотр карты, получение QR-кода</div>
          </div>
          <div className="bg-purple-950/50 border border-purple-800/50 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">🤝</div>
            <div className="font-semibold text-purple-300">Partner App</div>
            <div className="text-xs text-gray-400 mt-1">React • :3002</div>
            <div className="text-xs text-gray-500 mt-2">Сканирование QR, проверка статуса</div>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div className="flex flex-col items-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-xs text-gray-500 mt-1">REST API</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-orange-950/50 border border-orange-800/50 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="font-semibold text-orange-300">FastAPI Backend</div>
            <div className="text-xs text-gray-400 mt-1">Python • :8000</div>
            <div className="text-xs text-gray-500 mt-2">JWT Auth, QR генерация, бизнес-логика</div>
          </div>
          <div className="bg-cyan-950/50 border border-cyan-800/50 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">🐘</div>
            <div className="font-semibold text-cyan-300">PostgreSQL</div>
            <div className="text-xs text-gray-400 mt-1">DB • :5432</div>
            <div className="text-xs text-gray-500 mt-2">users, volunteers, verification_logs</div>
          </div>
        </div>
      </div>

      {/* Tech stack */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Стек технологий</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Python 3.12', icon: '🐍' },
            { name: 'FastAPI', icon: '⚡' },
            { name: 'PostgreSQL 16', icon: '🐘' },
            { name: 'SQLAlchemy 2.0', icon: '🔗' },
            { name: 'React 18', icon: '⚛️' },
            { name: 'Docker', icon: '🐳' },
            { name: 'JWT Auth', icon: '🔐' },
            { name: 'QR Code', icon: '📱' },
          ].map((tech) => (
            <div
              key={tech.name}
              className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700"
            >
              <div className="text-2xl mb-1">{tech.icon}</div>
              <div className="text-sm font-medium">{tech.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DockerSection() {
  return (
    <div>
      <SectionHeader
        title="Docker Compose"
        subtitle="Оркестрация 5 контейнеров с сетями и volumes"
      />
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-sm text-gray-300 mb-3">Контейнеры:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { name: 'db', desc: 'PostgreSQL 16', port: '5432', color: 'cyan' },
            { name: 'backend', desc: 'FastAPI + Uvicorn', port: '8000', color: 'orange' },
            { name: 'frontend-admin', desc: 'React (Admin)', port: '3000', color: 'blue' },
            { name: 'frontend-volunteer', desc: 'React (Volunteer)', port: '3001', color: 'green' },
            { name: 'frontend-partner', desc: 'React (Partner)', port: '3002', color: 'purple' },
          ].map((c) => (
            <div key={c.name} className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full bg-${c.color}-400`} />
              <div>
                <div className="font-mono text-sm">{c.name}</div>
                <div className="text-xs text-gray-400">{c.desc} → :{c.port}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <CodeBlock code={dockerCompose} language="yaml" filename="docker-compose.yml" />
    </div>
  );
}

function DatabaseSection() {
  return (
    <div>
      <SectionHeader
        title="Модели базы данных"
        subtitle="SQLAlchemy ORM модели + SQL скрипт инициализации"
      />

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-sm text-gray-300 mb-3">Таблицы:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="font-mono text-sm text-cyan-400 mb-2">users</div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• id (UUID PK)</li>
              <li>• email (unique)</li>
              <li>• hashed_password</li>
              <li>• full_name</li>
              <li>• role (admin|volunteer|partner)</li>
              <li>• is_active</li>
              <li>• created_at, updated_at</li>
            </ul>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="font-mono text-sm text-green-400 mb-2">volunteers</div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• id (UUID PK)</li>
              <li>• user_id (FK → users)</li>
              <li>• full_name</li>
              <li>• passport_data</li>
              <li>• card_id (unique)</li>
              <li>• expiration_date</li>
              <li>• status (active|expired|...)</li>
            </ul>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
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

      <CodeBlock code={dbModels} language="python" filename="app/models.py" />
      <CodeBlock code={dbInitSQL} language="sql" filename="db/init.sql" />
    </div>
  );
}

function BackendMainSection() {
  return (
    <div>
      <SectionHeader
        title="FastAPI Application"
        subtitle="Точка входа, middleware, подключение роутеров"
      />
      <CodeBlock code={backendMain} language="python" filename="app/main.py" />
      <CodeBlock code={backendDatabase} language="python" filename="app/database.py" />
      <CodeBlock code={backendRequirements} language="text" filename="requirements.txt" />
      <CodeBlock code={backendDockerfile} language="dockerfile" filename="backend/Dockerfile" />
    </div>
  );
}

function BackendAuthSection() {
  return (
    <div>
      <SectionHeader
        title="JWT Авторизация"
        subtitle="OAuth2 + JWT токены, роли, middleware"
      />
      <CodeBlock code={backendAuth} language="python" filename="app/routers/auth.py" />
    </div>
  );
}

function BackendAdminSection() {
  return (
    <div>
      <SectionHeader
        title="API Администратора"
        subtitle="CRUD волонтеров, продление карт, пагинация"
      />
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-sm text-gray-300 mb-3">Эндпоинты:</h3>
        <div className="space-y-2">
          {[
            { method: 'POST', path: '/api/admin/volunteers', desc: 'Создать волонтера' },
            { method: 'PUT', path: '/api/admin/volunteers/:id', desc: 'Обновить данные' },
            { method: 'GET', path: '/api/admin/volunteers', desc: 'Список (пагинация, фильтры)' },
            { method: 'GET', path: '/api/admin/volunteers/:id', desc: 'Данные волонтера' },
            { method: 'POST', path: '/api/admin/volunteers/:id/extend', desc: 'Продлить карту' },
          ].map((ep) => (
            <div key={ep.path + ep.method} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                ep.method === 'POST' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'
              }`}>
                {ep.method}
              </span>
              <code className="text-sm text-gray-300">{ep.path}</code>
              <span className="text-xs text-gray-500 ml-auto">{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>
      <CodeBlock code={backendAdmin} language="python" filename="app/routers/admin.py" />
    </div>
  );
}

function BackendVolunteerSection() {
  return (
    <div>
      <SectionHeader
        title="API Волонтера"
        subtitle="Получение данных карты и генерация QR-кода"
      />
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-sm text-gray-300 mb-3">Эндпоинты:</h3>
        <div className="space-y-2">
          {[
            { method: 'GET', path: '/api/volunteer/my-card', desc: 'Данные своей карты' },
            { method: 'GET', path: '/api/volunteer/qr-code', desc: 'QR-код (PNG image)' },
            { method: 'GET', path: '/api/volunteer/qr-code/base64', desc: 'QR в base64' },
          ].map((ep) => (
            <div key={ep.path} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-900 text-blue-300">
                {ep.method}
              </span>
              <code className="text-sm text-gray-300">{ep.path}</code>
              <span className="text-xs text-gray-500 ml-auto">{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>
      <CodeBlock code={backendVolunteer} language="python" filename="app/routers/volunteer.py" />
    </div>
  );
}

function BackendPartnerSection() {
  return (
    <div>
      <SectionHeader
        title="API Партнера"
        subtitle="Проверка QR-кодов, валидация статуса и срока"
      />
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-sm text-gray-300 mb-3">Эндпоинты:</h3>
        <div className="space-y-2">
          {[
            { method: 'POST', path: '/api/partner/verify-qr', desc: 'Проверить QR-код' },
            { method: 'GET', path: '/api/partner/volunteer/:id', desc: 'Публичные данные волонтера' },
          ].map((ep) => (
            <div key={ep.path} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                ep.method === 'POST' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'
              }`}>
                {ep.method}
              </span>
              <code className="text-sm text-gray-300">{ep.path}</code>
              <span className="text-xs text-gray-500 ml-auto">{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>
      <CodeBlock code={backendPartner} language="python" filename="app/routers/partner.py" />
    </div>
  );
}

function BackendSchemasSection() {
  return (
    <div>
      <SectionHeader
        title="Pydantic Schemas"
        subtitle="Схемы валидации входных/выходных данных"
      />
      <CodeBlock code={backendSchemas} language="python" filename="app/schemas.py" />
    </div>
  );
}

function FrontendAdminSection() {
  return (
    <div>
      <SectionHeader
        title="Frontend Admin"
        subtitle="Панель администратора на React + React Router"
      />

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-sm text-gray-300 mb-3">Структура роутинга:</h3>
        <div className="space-y-2 font-mono text-sm">
          <div className="text-gray-400">/login — Страница входа</div>
          <div className="text-gray-400">/ — Dashboard (статистика)</div>
          <div className="text-gray-400">/volunteers — Список волонтеров</div>
          <div className="text-gray-400">/volunteers/new — Создание волонтера</div>
          <div className="text-gray-400">/volunteers/:id/edit — Редактирование</div>
        </div>
      </div>

      <CodeBlock code={frontendAdminApp} language="tsx" filename="frontend-admin/src/App.tsx" />
      <CodeBlock code={frontendAdminAuthContext} language="tsx" filename="frontend-admin/src/context/AuthContext.tsx" />
    </div>
  );
}

function FrontendVolunteerSection() {
  return (
    <div>
      <SectionHeader
        title="Frontend Volunteer"
        subtitle="Приложение волонтера — просмотр карты и QR-кода"
      />

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-sm text-gray-300 mb-3">Структура роутинга:</h3>
        <div className="space-y-2 font-mono text-sm">
          <div className="text-gray-400">/login — Страница входа</div>
          <div className="text-gray-400">/ — Моя карта (данные)</div>
          <div className="text-gray-400">/qr — QR-код для предъявления</div>
        </div>
      </div>

      <CodeBlock code={frontendVolunteerApp} language="tsx" filename="frontend-volunteer/src/App.tsx" />
    </div>
  );
}

function FrontendPartnerSection() {
  return (
    <div>
      <SectionHeader
        title="Frontend Partner"
        subtitle="Приложение партнера — сканирование и проверка QR"
      />

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-sm text-gray-300 mb-3">Структура роутинга:</h3>
        <div className="space-y-2 font-mono text-sm">
          <div className="text-gray-400">/login — Страница входа</div>
          <div className="text-gray-400">/ — Сканирование QR-кода (камера)</div>
          <div className="text-gray-400">/manual — Ручной ввод ID карты</div>
          <div className="text-gray-400">/history — История проверок</div>
        </div>
      </div>

      <CodeBlock code={frontendPartnerApp} language="tsx" filename="frontend-partner/src/App.tsx" />
      <CodeBlock code={frontendPartnerScanQR} language="tsx" filename="frontend-partner/src/pages/ScanQR.tsx" />
    </div>
  );
}

function InstructionsSection() {
  return (
    <div>
      <SectionHeader
        title="Инструкции по запуску"
        subtitle="Пошаговое руководство для развёртывания системы"
      />

      <div className="space-y-6">
        {/* Step 1 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">1</span>
            <h3 className="font-semibold text-lg">Клонирование и структура</h3>
          </div>
          <CodeBlock
            code={`# Структура проекта
volunteer-cards/
├── docker-compose.yml
├── .env
├── db/
│   └── init.sql
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── database.py
│       ├── models.py
│       ├── schemas.py
│       └── routers/
│           ├── auth.py
│           ├── admin.py
│           ├── volunteer.py
│           └── partner.py
├── frontend-admin/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
├── frontend-volunteer/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
└── frontend-partner/
    ├── Dockerfile
    ├── nginx.conf
    └── src/`}
            language="bash"
            filename="Структура проекта"
          />
        </div>

        {/* Step 2 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">2</span>
            <h3 className="font-semibold text-lg">Переменные окружения</h3>
          </div>
          <CodeBlock
            code={`# .env
DB_PASSWORD=your_secure_password_here
JWT_SECRET=your_jwt_secret_key_min_32_chars
ACCESS_TOKEN_EXPIRE_MINUTES=60`}
            language="bash"
            filename=".env"
          />
        </div>

        {/* Step 3 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">3</span>
            <h3 className="font-semibold text-lg">Запуск системы</h3>
          </div>
          <CodeBlock
            code={`# Сборка и запуск всех контейнеров
docker-compose up -d --build

# Проверка статуса
docker-compose ps

# Логи backend
docker-compose logs -f backend

# Остановка
docker-compose down

# Остановка с удалением данных БД
docker-compose down -v`}
            language="bash"
            filename="Команды Docker"
          />
        </div>

        {/* Step 4 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">4</span>
            <h3 className="font-semibold text-lg">Доступ к сервисам</h3>
          </div>
          <div className="space-y-2">
            {[
              { url: 'http://localhost:8000/docs', desc: 'Swagger UI (API документация)' },
              { url: 'http://localhost:8000/redoc', desc: 'ReDoc документация' },
              { url: 'http://localhost:3000', desc: 'Admin Panel' },
              { url: 'http://localhost:3001', desc: 'Volunteer App' },
              { url: 'http://localhost:3002', desc: 'Partner App' },
            ].map((s) => (
              <div key={s.url} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-2">
                <code className="text-blue-400 text-sm">{s.url}</code>
                <span className="text-xs text-gray-400 ml-auto">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">5</span>
            <h3 className="font-semibold text-lg">Дополнительные файлы</h3>
          </div>
          <CodeBlock code={frontendDockerfile} language="dockerfile" filename="frontend-*/Dockerfile" />
          <CodeBlock code={nginxConf} language="nginx" filename="frontend-*/nginx.conf" />
        </div>
      </div>
    </div>
  );
}
