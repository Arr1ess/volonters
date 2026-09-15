import { Link } from 'react-router-dom';

export default function History() {
  // В реальном проекте здесь будет запрос к API для получения истории проверок
  // Пока это заглушка
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">📋 История проверок</h1>
          <Link to="/" className="text-sm text-purple-600">← Назад</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <p className="text-gray-500 text-center py-8">
            История проверок будет доступна после проведения первой проверки
          </p>
          <div className="text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm text-gray-400">
              Здесь отображаются все проверки QR-кодов, проведенные вашим аккаунтом
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
