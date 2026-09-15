import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface Volunteer {
  id: string;
  full_name: string;
  card_id: string;
  status: string;
  expiration_date: string;
}

export default function VolunteersList() {
  const { logout } = useAuth();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadVolunteers = async () => {
    try {
      const params: any = { page, per_page: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/volunteers', { params });
      setVolunteers(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadVolunteers(); }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    loadVolunteers();
  };

  const handleExtend = async (id: string) => {
    if (!confirm('Продлить карту на 12 месяцев?')) return;
    try {
      await api.post(`/admin/volunteers/${id}/extend`, { months: 12 });
      loadVolunteers();
    } catch (err) {
      alert('Ошибка продления');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить волонтера?')) return;
    try {
      await api.delete(`/admin/volunteers/${id}`);
      loadVolunteers();
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">🎫 Волонтеры</h1>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-blue-600 hover:text-blue-800">← Главная</Link>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Выйти</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Поиск по ФИО..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="px-3 py-2 border rounded-md text-sm flex-1 min-w-[200px]"
          />
          <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">
            Найти
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">Все статусы</option>
            <option value="active">Активные</option>
            <option value="expired">Просроченные</option>
            <option value="suspended">Приостановленные</option>
          </select>
          <Link to="/volunteers/new" className="px-4 py-2 bg-green-600 text-white rounded-md text-sm">
            + Добавить
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ФИО</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ID карты</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Действует до</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Статус</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody>
              {volunteers.map((v) => (
                <tr key={v.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{v.full_name}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{v.card_id}</td>
                  <td className="px-4 py-3 text-sm">{new Date(v.expiration_date).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(v.status)}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleExtend(v.id)}
                      className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                    >
                      Продлить
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
              {volunteers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">Нет данных</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              ←
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Стр. {page} из {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
