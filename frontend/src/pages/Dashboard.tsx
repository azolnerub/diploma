import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-indigo-600 rounded-xl rotate-45 animate-bounce"></div>
          <p className="text-slate-500 font-medium tracking-wide">Загрузка системы...</p>
        </div>
      </div>
    );
  }

  if (!user) {return null;}

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Современная Шапка */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
              A
            </div>
            <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              HR.Analytics
            </h1>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-slate-800">{user.full_name}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                {user.role?.toUpperCase()}
              </span>
            </div>
            <button
              onClick={logout}
              className="group flex items-center gap-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 px-4 py-2 rounded-xl transition-all font-bold text-sm"
            >
              Выйти 
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Приветствие */}
        <div className="mb-12">
          <h2 className="text-4xl font-black text-slate-900 mb-2">
            Здравствуйте, {user.full_name.split(' ').slice(1).join(' ')}! 👋
          </h2>
          <p className="text-slate-500 text-lg">Рады видеть вас в системе управления талантами.</p>
        </div>

        {/* Сетка карточек (Bento Grid Style) */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          
          {/* Главная карточка: Сотрудники */}
          <div 
            onClick={() => navigate(user?.role === 'hr' ? '/hr' : '/employees')}
            className="md:col-span-4 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                👥
              </div>
              <h3 className="text-3xl font-bold mb-3">База сотрудников</h3>
              <p className="text-slate-500 max-w-md text-lg">
                {user?.role === 'hr' 
                  ? 'Полный доступ к управлению штатом, редактированию данных и архиву.' 
                  : 'Список коллег вашего департамента с контактной информацией.'}
              </p>
            </div>
            <div className="absolute -bottom-10 -right-10 text-[12rem] opacity-[0.03] select-none font-black">USERS</div>
          </div>

          {/* Карточка: Оценки (Только для менеджеров) */}
          {user?.role === 'manager' && (
            <div 
              onClick={() => navigate('/hr/evaluate')}
              className="md:col-span-2 bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="text-3xl">⭐</div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Оценки</h3>
                <p className="text-purple-100 text-sm">Проведение аттестации и анализ компетенций команды.</p>
              </div>
            </div>
          )}

          {/* Карточка: Кадровый резерв */}
          <div className="md:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all group cursor-pointer">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 text-xl">
              🏆
            </div>
            <h3 className="text-xl font-bold mb-2">Кадровый резерв</h3>
            <p className="text-slate-500 text-sm">Алгоритмы подбора идеальных кандидатов на вакансии.</p>
          </div>

          {/* Дополнительная карточка: Аналитика (Декор или реальная ссылка) */}
          <div className="md:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm opacity-60 hover:opacity-100 transition-opacity cursor-not-allowed">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 text-xl">
              📊
            </div>
            <h3 className="text-xl font-bold mb-2">Отчёты</h3>
            <p className="text-slate-500 text-sm">Визуализация прогресса компании (скоро).</p>
          </div>

        </div>
      </main>
    </div>
  );
}