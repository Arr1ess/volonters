import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface VolunteerInfo {
  full_name: string;
  card_id: string;
  status: string;
  expiration_date: string;
  is_valid: boolean;
}

export default function ManualCheck() {
  const [volunteerId, setVolunteerId] = useState('');
  const [info, setInfo] = useState<VolunteerInfo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const statusLabel = (s: string) => {
    switch (s) {
      case 'active': return 'Активна';
      case 'expired': return 'Просрочена';
      case 'suspended': return 'Отключена';
      case 'revoked': return 'Отозвана';
      default: return s;
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerId.trim()) return;
    setError('');
    setInfo(null);
    setLoading(true);

    try {
      const input = volunteerId.trim();
      // Определяем формат ввода: UUID или card_id
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
      
      let res;
      if (isUUID) {
        res = await api.get(`/partner/volunteer/${input}`);
      } else {
        res = await api.get(`/partner/volunteer/by-card/${input}`);
      }
      setInfo(res.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Волонтер не найден';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">🔍 Ручная проверка</h1>
          <Link to="/" className="text-sm text-purple-600">← Назад</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleCheck}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UUID волонтера</label>
              <input
                type="text"
                value={volunteerId}
                onChange={(e) => setVolunteerId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !volunteerId.trim()}
              className="mt-3 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Поиск...' : 'Найти'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {info && (
            <div className={`mt-4 rounded-lg p-4 border ${
              info.is_valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="text-3xl mb-2">{info.is_valid ? '✅' : '❌'}</div>
              <h3 className="text-lg font-bold">{info.full_name}</h3>
              <p className="text-xs text-gray-600 font-mono mt-1">ID: {info.card_id}</p>
              <p className="text-sm mt-2">
                Статус: <strong>{statusLabel(info.status)}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Действует до: {new Date(info.expiration_date).toLocaleDateString('ru-RU')}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
