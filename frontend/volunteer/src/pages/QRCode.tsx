import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function QRCode() {
  const [qrUrl, setQrUrl] = useState('');
  const [cardId, setCardId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/volunteer/qr-code/base64')
      .then(res => {
        setQrUrl(res.data.qr_base64);
        setCardId(res.data.card_id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">📱 QR-код</h1>
          <Link to="/" className="text-sm text-green-600 hover:text-green-800">← Карта</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {qrUrl ? (
            <>
              <img src={qrUrl} alt="QR Code" className="mx-auto w-64 h-64 border-4 border-gray-100 rounded-xl" />
              <p className="mt-4 text-sm text-gray-500">
                Предъявите QR-код партнеру для проверки
              </p>
              <p className="mt-2 text-xs text-gray-400 font-mono">{cardId}</p>
            </>
          ) : (
            <p className="text-red-500">Не удалось загрузить QR-код</p>
          )}
        </div>
      </main>
    </div>
  );
}
