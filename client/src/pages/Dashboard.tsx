import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Users, Trophy, Star, LayoutDashboard, UserCircle } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const role = user?.role || '';
    const hasAccess = ['hr', 'manager', 'director'].includes(role);
    if (!loading && user && !hasAccess) {
      navigate('/profile', { replace: true });
    }
  }, [user, loading, navigate]);
  
  if (loading) return <DashboardLoader />;
  if (!user) return null; 

  const firstName = user.full_name.split(' ')[1] || user.full_name.split(' ')[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-100 font-sans">
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 rotate-3 hover:rotate-0 transition-transform duration-300">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">HR.Портал</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">В сети</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <p className="text-sm font-black text-slate-800">{user.full_name}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md uppercase tracking-wider">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12 relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-100/50 rounded-full blur-3xl -z-10" />
          <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-3">
            Здравствуйте, {firstName} <span className="inline-block animate-bounce-slow">👋</span>
          </h2>
          <p className="text-slate-500 text-lg font-medium max-w-2xl leading-relaxed">
            Ваш центр управления талантами. Здесь вы можете анализировать команду, управлять резервом и оценивать прогресс.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[280px]">
          <div
            onClick={() => navigate(user?.role === 'hr' ? '/hr' : '/employees')}
            className="md:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-10 flex flex-col justify-between hover:shadow-2xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <Users size={200} />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
                <Users size={28} />
              </div>
              <h3 className="text-3xl font-black mb-3">Управление <br />сотрудниками</h3>
              <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
                {user?.role === 'hr'
                  ? 'Управление кадровым составом, профилями и историями развития'
                  : 'Просмотр команды'}
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/profile')}
            className="md:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] p-10 hover:shadow-2xl hover:border-indigo-400 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
          >
             <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-[3] transition-transform duration-700 -z-0" />
             <div className="relative z-10">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <UserCircle size={24} />
              </div>
              <div className="mt-12">
                <h3 className="text-2xl font-black mb-2">Мой профиль</h3>
                <p className="text-slate-500 text-sm font-medium">Навыки, траектория и обратная связь</p>
              </div>
             </div>
          </div>

          {(user?.role === 'manager' || user?.role === 'director') && (
            <div
              onClick={() => navigate('/evaluate')}
              className="md:col-span-4 bg-slate-900 rounded-[2.5rem] p-10 text-white hover:bg-slate-800 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Star className="text-amber-400 fill-amber-400" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black mb-2">Оценка персонала</h3>
                <p className="text-slate-400 group-hover:text-white/80 transition-colors text-sm font-medium">
                  {user?.role === 'director'
                  ? 'Оценивание работы руководителей отделов'
                  : 'Оценивание компетенций сотрудников'}
                </p>
              </div>
            </div>
          )}

          <div
            onClick={() => navigate('/reserve')}
            className="md:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] p-10 hover:shadow-2xl hover:border-emerald-200 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
              <Trophy size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-3">Кадровый резерв</h3>
              <p className="text-slate-500 text-sm font-medium">Поиск и развитие будущих лидеров</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-slate-100 border-t-indigo-600 rounded-2xl animate-spin" />
          <LayoutDashboard className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={24} />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Initializing Portal</p>
      </div>
    </div>
  );
}