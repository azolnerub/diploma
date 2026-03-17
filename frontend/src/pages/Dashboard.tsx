import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="text-xl font-medium text-gray-700">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!user) {return null;}

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Анализ компетенций и кадровый резерв</h1>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="font-semibold">{user.full_name}</p>
              <p className="text-sm text-indigo-200">
                {user.role === 'hr' && 'HR-специалист'}
                {user.role === 'manager' && 'Руководитель'}
                {user.role === 'employee' && 'Сотрудник'}
              </p>
            </div>

            <button
              onClick={logout}
              className="bg-indigo-800 hover:bg-red-600 px-5 py-2 rounded-lg transition-all"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow-xl p-10">
          <h2 className="text-4xl font-bold text-indigo-800 mb-8">
            Добро пожаловать, {user.full_name}!
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-indigo-50 p-8 rounded-xl border border-indigo-100 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => window.location.href = '/hr'}>
              <h3 className="text-2xl font-semibold mb-3">Сотрудники</h3>
              <p className="text-gray-600">Управление персоналом (HR)</p>
            </div>

            <div className="bg-purple-50 p-8 rounded-xl border border-purple-100">
              <h3 className="text-2xl font-semibold mb-3">Оценки</h3>
              <p className="text-gray-600">Форма оценки компетенций</p>
            </div>

            <div className="bg-green-50 p-8 rounded-xl border border-green-100">
              <h3 className="text-2xl font-semibold mb-3">Кадровый резерв</h3>
              <p className="text-gray-600">Автоматический отбор</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}