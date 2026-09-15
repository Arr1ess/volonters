import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface VerifyResult {
  is_valid: boolean;
  reason?: string;
  volunteer_name?: string;
  card_id?: string;
  expiration_date?: string;
}

export default function Scanner() {
  const { logout } = useAuth();
  const [qrData, setQrData] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrData.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await api.post('/partner/verify-qr', { qr_data: qrData.trim() });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка проверки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">🤝 Проверка карты</h1>
          <div className="flex items-center gap-3">
            <Link to="/manual" className="text-sm text-purple-600">Ручной ввод</Link>
            <button onClick={logout} className="text-sm text-red-600">Выйти</button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">📷 Сканирование QR-кода</h2>
          <p className="text-sm text-gray-500 mb-4">
            Отсканируйте QR-код волонтера или введите данные вручную
          </p>

          <form onSubmit={handleVerify}>
            <textarea
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              placeholder="Вставьте данные из QR-кода (VOLUNTEER_CARD:...)"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm h-24 resize-none"
            />
            <button
              type="submit"
              disabled={loading || !qrData.trim()}
              className="mt-3 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Проверка...' : 'Проверить'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className={`mt-4 rounded-lg p-4 border ${
              result.is_valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="text-3xl mb-2">{result.is_valid ? '✅' : '❌'}</div>
              <h3 className={`text-lg font-bold ${
                result.is_valid ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.is_valid ? 'Карта действительна' : 'Карта недействительна'}
              </h3>
              {result.volunteer_name && (
                <p className="mt-1 text-sm">Волонтер: <strong>{result.volunteer_name}</strong></p>
              )}
              {result.card_id && (
                <p className="text-xs text-gray-600 font-mono">ID: {result.card_id}</p>
              )}
              {result.reason && (
                <p className="text-sm mt-1">{result.reason}</p>
              )}
              {result.expiration_date && (
                <p className="text-sm text-gray-600">
                  Действует до: {new Date(result.expiration_date).toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Link to="/manual" className="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200">
            🔍 Ручная проверка
          </Link>
          <Link to="/history" className="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200">
            📋 История
          </Link>
        </div>
      </main>
    </div>
  );
}
