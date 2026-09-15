import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface Stats {
  total: number;
  active: number;
  expired: number;
  suspended: number;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, expired: 0, suspended: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Загружаем статистику
    Promise.all([
      api.get('/admin/volunteers', { params: { per_page: 1 } }),
      api.get('/admin/volunteers', { params: { per_page: 1, status: 'active' } }),
      api.get('/admin/volunteers', { params: { per_page: 1, status: 'expired' } }),
      api.get('/admin/volunteers', { params: { per_page: 1, status: 'suspended' } }),
    ]).then(([all, active, expired, suspended]) => {
      setStats({
        total: all.data.total,
        active: active.data.total,
        expired: expired.data.total,
        suspended: suspended.data.total,
      });
    }).catch((err) => {
      console.error('Error loading stats:', err);
      setError('Не удалось загрузить статистику. Проверьте подключение к API.');
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">🎫 Панель администратора</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.full_name}</span>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 text-sm">
            ⚠️ {error}
          </div>
        )}
        {/* Navigation */}
        <nav className="mb-8 flex gap-4 flex-wrap">
          <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">
            Главная
          </Link>
          <Link to="/volunteers" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">
            Волонтеры
          </Link>
          <Link to="/volunteers/new" className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
            + Добавить волонтера
          </Link>
          <Link to="/partners" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">
            Партнеры
          </Link>
          <Link to="/partners/new" className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700">
            + Добавить партнера
          </Link>
        </nav>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-500">Всего волонтеров</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-500">Активные</div>
            <div className="text-3xl font-bold text-green-600 mt-1">{stats.active}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-500">Просроченные</div>
            <div className="text-3xl font-bold text-red-600 mt-1">{stats.expired}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-500">Приостановленные</div>
            <div className="text-3xl font-bold text-yellow-600 mt-1">{stats.suspended}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
