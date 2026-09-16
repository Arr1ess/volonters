import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    return () => {
      // Очистка при размонтировании
      if (scannerRef.current && scanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [scanning]);

  const startScanner = async () => {
    setCameraError('');
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR-код распознан
          setQrData(decodedText);
          handleVerify(decodedText);
          scanner.stop().catch(console.error);
          setScanning(false);
        },
        (errorMessage) => {
          // Ошибка сканирования (игнорируем, это нормально при поиске QR)
        }
      );
      
      setScanning(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError('Не удалось получить доступ к камере. Разрешите доступ или используйте ручной ввод.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error('Stop scanner error:', err);
      }
    }
  };

  const handleVerify = async (data: string) => {
    if (!data.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await api.post('/partner/verify-qr', { qr_data: data.trim() });
      setResult(res.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Ошибка проверки';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(qrData);
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
          
          {/* Кнопка активации камеры */}
          {!scanning && (
            <button
              onClick={startScanner}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 mb-4 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Включить камеру
            </button>
          )}

          {/* Область сканера */}
          {scanning && (
            <div className="mb-4">
              <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
              <button
                onClick={stopScanner}
                className="w-full mt-3 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
              >
                Выключить камеру
              </button>
            </div>
          )}

          {/* Ошибка камеры */}
          {cameraError && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
              ⚠️ {cameraError}
            </div>
          )}

          {/* Ручной ввод */}
          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-gray-500 mb-2">Или введите данные вручную:</p>
            <form onSubmit={handleManualSubmit}>
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
          </div>

          {/* Ошибка проверки */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Результат проверки */}
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
