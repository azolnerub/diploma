import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { 
  TrendingUp, Award, Target, History, 
  Users, MessageSquare, LayoutDashboard, ChevronDown 
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  ResponsiveContainer, LineChart, 
  Line, XAxis, YAxis, Tooltip, CartesianGrid, PolarRadiusAxis 
} from 'recharts';

// --- Типизация данных ---
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
  diff: number;
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
  radar_data: RadarPoint[];
  trajectories: Trajectory[];
  history: HistoryPoint[];
  stats: { dept_growth: number; personal_growth: number };
  reserve: { target_name: string; ready_percent: number } | null;
  feedback: FeedbackSession[];
}

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

  // Хендлер для безопасного перехода на страницу анализа
  const handleMatchAnalysis = (trajectory: Trajectory) => {
    if (!user?.id) return;
    
    if (trajectory.role_id) {
      // Переходим по ID роли, где внутри уже будет детальный разбор должности
      navigate(`/hr/match/role/${user.id}/${trajectory.role_id}`);
    } else {
      console.warn("Role ID not found for this position");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data) return <div className="p-10 text-center font-bold text-red-500">Данные профиля не найдены</div>;

  const canAccessAdmin = user?.role === 'hr' || user?.role === 'manager';

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      {/* HEADER */}
      <div className="max-w-7xl auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Мой профиль</h1>
          <p className="text-slate-500 font-medium">{user?.full_name} • {user?.position}</p>
        </div>
        {canAccessAdmin && (
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            <LayoutDashboard size={20} />
            <span>Панель управления</span>
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 1. Radar Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Target size={20}/></div>
              <h2 className="text-xl font-black">Карта компетенций</h2>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.radar_data}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 11, fontWeight: 700}} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Radar name="Ваш уровень" dataKey="cur" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                  <Radar name="Требование должности" dataKey="req" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Карьерные возможности */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-emerald-600">
              <TrendingUp size={24}/>
              <h2 className="text-xl font-black text-slate-900">Карьерные возможности</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.trajectories.map((t, idx) => (
                <div key={idx} className="p-6 rounded-3xl border border-slate-100 bg-slate-50 hover:border-indigo-200 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Должность</p>
                        <h3 className="font-bold text-slate-800 leading-tight">{t.pos_name}</h3>
                    </div>
                    <span className="text-indigo-600 font-black text-lg">{t.match_percent}%</span>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    {t.gap.map((g, i) => (
                      <div key={i} className="text-xs">
                        <p className="text-slate-500 mb-2">{g.competency_name}</p>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 transition-all" 
                            style={{width: `${Math.min(100, (g.current/g.required)*100)}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleMatchAnalysis(t)}
                    disabled={!t.role_id}
                    className={`block w-full py-3 border rounded-2xl text-center text-[10px] font-black uppercase tracking-widest transition-all ${
                      t.role_id 
                      ? "bg-white border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-200" 
                      : "bg-slate-50 border-transparent text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    {t.role_id ? "Анализ соответствия" : "Роль не определена"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Динамика развития */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <History size={20} className="text-indigo-500"/> Динамика развития
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const pData = payload[0].payload;
                        const currentIndex = data.history.findIndex(h => h.date === pData.date);
                        let manualDiff = 0;
                        if (currentIndex > 0) {
                          manualDiff = Number((pData.value - data.history[currentIndex - 1].value).toFixed(1));
                        } else {
                          manualDiff = pData.value;
                        }

                        return (
                          <div className="bg-white p-4 shadow-2xl rounded-2xl border border-slate-50">
                            <p className="text-xs font-bold text-slate-400 mb-1">{pData.date}</p>
                            <p className={`text-2xl font-black mb-1 ${pData.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {pData.value >= 0 ? '+' : ''}{pData.value}%
                            </p>
                            <div className={`flex items-center gap-1 text-[10px] font-bold ${manualDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {manualDiff >= 0 ? '▲' : '▼'} {Math.abs(manualDiff)}% <span className="text-slate-400">к прошлому</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={5} dot={{r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff'}} activeDot={{r: 10, fill: '#4f46e5'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* 4. Кадровый резерв */}
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="relative z-10">
              <div className="bg-white/20 w-fit p-3 rounded-2xl mb-4"><Award size={24}/></div>
              <h3 className="text-lg font-black mb-2">Кадровый резерв</h3>
              {data.reserve ? (
                <>
                  <p className="text-indigo-100 text-sm mb-6">Цель: <span className="font-bold text-white">{data.reserve.target_name}</span></p>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-black">{data.reserve.ready_percent}%</span>
                    <span className="text-indigo-200 text-xs mb-1 font-bold">готовность</span>
                  </div>
                </>
              ) : <p className="text-indigo-100 text-sm mb-6 italic">Вы пока не состоите в резерве</p>}
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          {/* 5. Прогресс команды */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Users size={20} className="text-slate-400"/>
              <h3 className="font-black">Прогресс команды</h3>
            </div>
            <div className="space-y-4">
              <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">Средний рост отдела</p>
                <span className="font-black text-2xl text-slate-800">+{data.stats.dept_growth}%</span>
              </div>
              
              <div className="p-5 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-wider">Ваш личный рост</p>
                <div className="flex items-center justify-between mb-1">
                    <span className={`font-black text-2xl ${data.stats.personal_growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {data.stats.personal_growth >= 0 ? '+' : ''}{data.stats.personal_growth}%
                    </span>
                    {data.stats.personal_growth > data.stats.dept_growth && (
                        <span className="text-[9px] bg-emerald-500 text-white px-2 py-1 rounded-full font-black uppercase">Выше среднего</span>
                    )}
                </div>
                
                {data.history.length >= 2 && (() => {
                  const current = data.history[data.history.length - 1].value;
                  const previous = data.history[data.history.length - 2].value;
                  const manualDiff = Number((current - previous).toFixed(1));

                  return (
                    <div className={`flex items-center gap-1 text-[10px] font-bold ${manualDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      <span>{manualDiff >= 0 ? '▲' : '▼'} {Math.abs(manualDiff)}%</span>
                      <span className="text-slate-400 font-medium tracking-tight">к прошлому периоду</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 6. Обратная связь */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-rose-500">
              <MessageSquare size={20}/>
              <h3 className="font-black text-slate-900">Обратная связь</h3>
            </div>
            <div className="space-y-3">
              {data.feedback.map((session, i) => (
                <details key={i} className="group border-b border-slate-100 last:border-0 pb-3">
                  <summary className="flex justify-between items-center cursor-pointer list-none py-2 outline-none">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Оценка от {session.date}</p>
                        <p className="text-xs font-black text-slate-700">{session.manager}</p>
                    </div>
                    <ChevronDown size={16} className="text-slate-300 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="mt-4 space-y-4 pl-3 border-l-2 border-indigo-50">
                    {session.details.map((d, j) => (
                      <div key={j} className="relative">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[11px] font-bold text-slate-600">{d.comp}</span>
                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{d.val}%</span>
                        </div>
                        {d.comm && <p className="text-xs text-slate-400 italic leading-relaxed">"{d.comm}"</p>}
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