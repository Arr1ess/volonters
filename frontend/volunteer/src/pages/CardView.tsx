import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface CardData {
  full_name: string;
  card_id: string;
  status: string;
  expiration_date: string;
}

export default function CardView() {
  const { user, logout } = useAuth();
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/volunteer/my-card')
      .then(res => setCard(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen">Загрузка...</div>;

  const isExpired = card && new Date(card.expiration_date) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">🧑‍🤝‍🧑 Моя карта</h1>
          <div className="flex items-center gap-3">
            <Link to="/qr" className="text-sm text-green-600 hover:text-green-800">QR-код →</Link>
            <button onClick={logout} className="text-sm text-red-600">Выйти</button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {card && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎫</div>
              <h2 className="text-xl font-bold text-gray-900">{card.full_name}</h2>
              <p className="text-gray-500 text-sm mt-1">Карта волонтера</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500 text-sm">ID карты</span>
                <span className="font-mono text-sm font-medium">{card.card_id}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500 text-sm">Действует до</span>
                <span className="text-sm">{new Date(card.expiration_date).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500 text-sm">Статус</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {isExpired ? 'Просрочена' : 'Действительна'}
                </span>
              </div>
            </div>

            <Link
              to="/qr"
              className="mt-6 block text-center bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              📱 Показать QR-код
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
