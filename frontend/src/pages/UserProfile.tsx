import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { TrendingUp, Award, Target, History, Users, MessageSquare, LayoutDashboard, ChevronDown, KeyRound, Zap } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PolarRadiusAxis } from 'recharts';

interface RadarPoint {
  subject: string;
  cur: number;
  req: number;
}

interface Trajectory {
  pos_id: number;
  role_id: number | null;
  pos_name: string;
  match_percent: number;
  gap: { competency_name: string; current: number; required: number }[];
}

interface HistoryPoint {
  date: string; 
  value: number;
}

interface FeedbackDetail {
  comp: string;
  val: number;
  comm: string;
}

interface FeedbackSession {
  date: string;
  manager: string;
  details: FeedbackDetail[];
}

interface ProfileData {
  employee_id: number;
  radar_data: RadarPoint[];
  trajectories: Trajectory[];
  history: HistoryPoint[];
  stats: { dept_growth: number; personal_growth: number };
  reserve: { target_name: string; ready_percent: number } | null;
  feedback: FeedbackSession[];
}

// Хелпер для локализации периодов (Кварталы/Полугодия)
const formatPeriod = (periodStr: string) => {
  if (periodStr.includes('Q')) {
    const [year, q] = periodStr.split('-');
    const qMap: Record<string, string> = { 'Q1': 'I кв.', 'Q2': 'II кв.', 'Q3': 'III кв.', 'Q4': 'IV кв.' };
    return `${qMap[q] || q} ${year}`;
  }
  if (periodStr.includes('H')) {
    const [year, h] = periodStr.split('-');
    return h === 'H1' ? `1-е пол. ${year}` : `2-е пол. ${year}`;
  }
  return periodStr; 
};

const Avatar = ({ name }: { name?: string }) => {
  const initials = name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
  return (
    <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-100 border-4 border-white">
      {initials}
    </div>
  );
};

export default function UserProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('employees/me/profile_full/');
        setData(res.data);
      } catch (err) {
        console.error("Ошибка при загрузке профиля:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleMatchAnalysis = (trajectory: Trajectory) => {
    if (!data?.employee_id || !trajectory.role_id) return;
    navigate(`/hr/match/role/${data.employee_id}/${trajectory.role_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-10 text-center font-bold text-red-500">Профиль не найден</div>;

  const canAccessAdmin = user?.role === 'hr' || user?.role === 'manager';

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans pb-20">
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <Avatar name={user?.full_name} />
          <div>
            <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">{user?.full_name}</h1>
                <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/20">В штате</span>
            </div>
            <p className="text-slate-500 font-bold text-lg">
                <span className="text-indigo-600">{user?.position}</span> <span className="mx-2 text-slate-300">/</span> {user?.department || '-'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
          onClick={() => navigate('/change-password')} 
          className="group flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-6 py-4 rounded-[20px] font-bold hover:bg-slate-50 transition shadow-sm active:scale-95">
            <KeyRound size={18} className="group-hover:rotate-12 transition-transform" />
            <span>Сменить пароль</span>
          </button>
          {canAccessAdmin && (
            <button 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-[20px] font-bold hover:bg-indigo-600 transition shadow-xl shadow-slate-200 active:scale-95">
              <LayoutDashboard size={18} />
              <span>Панель управления</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          {/* Лепестковая диаграмма */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Target size={24}/></div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Карта компетенций</h2>
                </div>
                <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span> Требуемый уровень</div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span> Текущий уровень</div>
                </div>
            </div>
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.radar_data}>
                  <PolarGrid stroke="#e2e8f0"/>
                  <PolarAngleAxis dataKey="subject" tick={{fill: '#6a7481', fontSize: 12, fontWeight: 700}}/>
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false}/>
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                  <Radar name="Ваш уровень" dataKey="cur" stroke="#32CD32" fill="#32CD32" fillOpacity={0.4} strokeWidth={2}/>
                  <Radar name="Требование" dataKey="req" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} strokeWidth={2}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Карьерный рост */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><TrendingUp size={24}/></div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Карьерные возможности</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.trajectories.map((t, idx) => (
                <div key={idx} className="p-8 rounded-[32px] border border-slate-50 bg-[#FBFBFF] hover:border-indigo-100 hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-1 tracking-widest italic">Целевая должность</p>
                        <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{t.pos_name}</h3>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-slate-900 leading-none">{t.match_percent}%</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">Индекс соответствия</span>
                    </div>
                  </div>
                  
                  <div className="space-y-5 mb-8">
                    {t.gap.slice(0, 3).map((g, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[11px] font-bold mb-2">
                            <span className="text-slate-500">{g.competency_name}</span>
                            <span className="text-indigo-600">{(g.current/g.required * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                            style={{width: `${Math.min(100, (g.current/g.required)*100)}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleMatchAnalysis(t)}
                    disabled={!t.role_id}
                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      t.role_id 
                      ? "bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900" 
                      : "bg-slate-50 text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    Анализ соответствия
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Динамика развития (Квартальный/Полугодовой график) */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl"><History size={24}/></div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Динамика развития</h2>
            </div>
            <div className="h-[350px] w-full px-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.history}>
                  <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatPeriod}
                    tick={{fontSize: 12, fontWeight: 700, fill: '#94a3b8'}} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={15}
                  />
                  <YAxis tick={{fontSize: 12, fontWeight: 700, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`}/>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const pData = payload[0].payload;
                        return (
                          <div className="bg-white p-5 shadow-2xl rounded-[20px] border border-slate-50 min-w-[150px]">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                                {formatPeriod(pData.date)}
                            </p>
                            <p className="text-3xl font-black text-indigo-600 mb-1">{pData.value}%</p>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase">
                              <Zap size={10} className="fill-emerald-500"/> Итог среза
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#4f46e5" 
                    strokeWidth={5} 
                    dot={{r: 7, fill: '#fff', strokeWidth: 3, stroke: '#4f46e5'}} 
                    activeDot={{r: 10, fill: '#4f46e5', stroke: '#fff', strokeWidth: 4}} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          
          {/* Кадровый резерв */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[40px] p-10 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="bg-white/20 backdrop-blur-md w-fit p-4 rounded-2xl mb-8 group-hover:scale-110 transition-transform">
                <Award size={32}/>
              </div>
              
              <div className="mb-8">
                  <h3 className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-1 italic">Высокий потенциал</h3>
                  <h3 className="text-3xl font-black tracking-tight leading-none">В кадровом резерве на:</h3>
              </div>

              {data.reserve ? (
                <div className="space-y-8">
                  <div className="bg-white/10 border border-white/10 p-5 rounded-3xl">
                    <p className="font-black text-xl">{data.reserve.target_name}</p>
                  </div>

                  <div className="flex items-end gap-4">
                    <span className="text-7xl font-black tracking-tighter leading-none">{data.reserve.ready_percent}%</span>
                    <div className="mb-2">
                        <p className="text-indigo-200 text-[10px] font-black uppercase tracking-wider mb-2">Готовность</p>
                        <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white transition-all duration-1000" style={{width: `${data.reserve.ready_percent}%`}}></div>
                        </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-indigo-100 text-sm font-medium italic opacity-60">Программа развития не активна</p>
              )}
            </div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
          </div>

          {/* Статистика по отделу */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8 text-slate-400">
              <Users size={24}/>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Статистика по отделу</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="p-6 bg-[#F8FAFC] rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Рост отдела</p>
                <span className="font-black text-3xl text-slate-800">+{data.stats.dept_growth}%</span>
              </div>
              
              <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
                <p className="text-[10px] font-black text-indigo-500 uppercase mb-3 tracking-widest">Личный рост</p>
                <div className="flex items-center justify-between">
                    <span className={`font-black text-3xl ${data.stats.personal_growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {data.stats.personal_growth >= 0 ? '+' : ''}{data.stats.personal_growth}%
                    </span>
                    {data.stats.personal_growth > data.stats.dept_growth && (
                        <span className="bg-emerald-500 text-white px-3 py-1 rounded-xl text-[9px] font-black uppercase">Выше среднего</span>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Обратная связь */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><MessageSquare size={24}/></div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Обратная связь</h3>
            </div>
            
            <div className="space-y-4">
              {data.feedback.map((session, i) => (
                <details key={i} className="group overflow-hidden rounded-[24px] border border-slate-50">
                  <summary className="flex justify-between items-center cursor-pointer list-none p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-1 tracking-widest">{formatPeriod(session.date)}</p>
                        <p className="text-sm font-black text-slate-700">{session.manager}</p>
                    </div>
                    <ChevronDown size={18} className="text-slate-300 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-6 bg-white space-y-6 border-t border-slate-50">
                    {session.details.map((d, j) => (
                      <div key={j} className="relative pl-4 border-l-2 border-indigo-100">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{d.comp}</span>
                            <span className="text-xs font-black text-indigo-600">{d.val}%</span>
                        </div>
                        {d.comm && <p className="text-xs text-slate-400 font-medium italic leading-relaxed">«{d.comm}»</p>}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}