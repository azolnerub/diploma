import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, NavigateFunction } from 'react-router-dom';
import { ArrowLeft, Search, TrendingUp, TrendingDown, Award, BarChart3, UserCheck } from 'lucide-react';
import api from '../api/axios';

interface Candidate {
  employee_id: number;
  full_name: string;
  current_position_name: string;
  match_index: number;
  dynamics_score: number;
  priority: number;
  target_role_id?: number | null;
}

export default function ReservePositionCandidates() {
  const { position_id } = useParams<{ position_id: string }>();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positionName, setPositionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'match' | 'dynamics'>('priority');

  useEffect(() => {
    const fetchData = async () => {
      if (!position_id) return;
      try {
        setLoading(true);
        const res = await api.get(`/positions/${position_id}/candidates/`);
        setPositionName(res.data.position_name || 'Целевая должность');
        setCandidates(res.data.candidates || []);
      } catch {
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [position_id]);

  const processedCandidates = useMemo(() => {
    const ranked = [...candidates].sort((a, b) => b.match_index - a.match_index);
    return ranked.map((c, index) => ({
      ...c,
      priority: index + 1 
    }));
  }, [candidates]);

  const filteredAndSorted = useMemo(() => {
    let result = [...processedCandidates];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => c.full_name.toLowerCase().includes(term));
    }

    return result.sort((a, b) => {
      if (sortBy === 'match') return b.match_index - a.match_index;
      if (sortBy === 'dynamics') return b.dynamics_score - a.dynamics_score;
      return a.priority - b.priority; 
    });
  }, [processedCandidates, searchTerm, sortBy]);

  if (loading) return <LoadingState />;
  if (error) return <div className="p-20 text-center text-red-500 font-bold">{error}</div>;

  return (
    <div className="min-h-screen bg-[#FBFBFE] pb-20">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <button 
              onClick={() => navigate('/hr/reserve/positions')} 
              className="group mb-6 flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
              К списку должностей
            </button>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Кандидаты в резерв</h1>
            <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full w-fit">
              <Award size={18} />
              <span className="font-bold tracking-wide uppercase text-xs">{positionName}</span>
            </div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Поиск по ФИО сотрудника..." 
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[1.25rem] outline-none shadow-sm focus:border-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 bg-white p-1.5 border border-slate-200 rounded-[1.25rem] shadow-sm">
            {(['priority', 'match', 'dynamics'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSortBy(type)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${
                  sortBy === type ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {type === 'priority' ? 'Приоритет' : type === 'match' ? 'Соответствие' : 'Динамика'}
              </button>
            ))}
          </div>
        </div>

        {filteredAndSorted.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAndSorted.map((candidate) => (
              <CandidateCard key={candidate.employee_id} candidate={candidate} navigate={navigate} />
            ))}
          </div>
        ) : (
          <div className="text-center py-40 bg-white rounded-[3rem] border border-slate-100">
            <p className="text-slate-400 font-medium">Кандидаты не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CandidateCard({ candidate, navigate }: { candidate: Candidate; navigate: NavigateFunction }) {
  const isPositive = candidate.dynamics_score > 0;
  const isNegative = candidate.dynamics_score < 0;

  const priorityColor = candidate.priority === 1 
    ? "bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-100" 
    : "bg-slate-50 text-slate-500 border-slate-100";

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${priorityColor}`}>
            Приоритет {candidate.priority}
          </div>
          <div className="text-slate-200 group-hover:text-indigo-500 transition-colors">
            <UserCheck size={28} />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">{candidate.full_name}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{candidate.current_position_name}</p>
        </div>

        <div className="bg-slate-50/80 rounded-[2rem] p-5 mb-6 border border-slate-50">
          <div className="flex justify-between items-end mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase">Соответствие</span>
            <span className={`text-2xl font-black ${candidate.match_index >= 80 ? 'text-emerald-600' : 'text-slate-900'}`}>
              {candidate.match_index}%
            </span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                candidate.match_index >= 80 ? 'bg-emerald-500' : 
                candidate.match_index >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${candidate.match_index}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-2 mb-8">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Динамика</span>
            <div className={`flex items-center gap-1 font-black text-lg ${isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-slate-300'}`}>
              {isPositive ? <TrendingUp size={18} /> : isNegative ? <TrendingDown size={18} /> : null}
              {isPositive && '+'}{candidate.dynamics_score}%
            </div>
          </div>
          <div className="h-8 w-[1px] bg-slate-100" />
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Статус</span>
            <span className="text-xs font-black text-slate-700 uppercase">
              {candidate.match_index >= 80 ? 'Готов к ротации' : 'В развитии'}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => candidate.target_role_id && navigate(`/hr/match/role/${candidate.employee_id}/${candidate.target_role_id}`)}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-slate-100"
      >
        <BarChart3 size={18} />
        Детальный анализ
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Сортировка резерва...</p>
    </div>
  );
}