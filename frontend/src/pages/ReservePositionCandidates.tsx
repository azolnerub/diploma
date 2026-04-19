import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, NavigateFunction  } from 'react-router-dom';
import { ArrowLeft, Search, SlidersHorizontal, TrendingUp, TrendingDown, Award, Trash2, BarChart3, UserCheck } from 'lucide-react';
import api from '../api/axios';

interface Candidate {
  employee_id: number;
  full_name: string;
  current_position_name: string;
  department_name: string;
  match_index: number; 
  dynamics_score: number;
  priority: number;
  target_position_name: string;
}

export default function ReservePositionCandidates() {
  const { position_id } = useParams<{ position_id: string }>();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positionName, setPositionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'match' | 'dynamics' | 'priority'>('match');

  useEffect(() => {
    const fetchData = async () => {
      if (!position_id) return;
      try {
        setLoading(true);
        const res = await api.get(`/positions/${position_id}/candidates/`);
        setPositionName(res.data.position_name || 'Целевая должность');
        setCandidates(res.data.candidates || []);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err) {
             const axiosError = err as { response: { data?: { detail?: string } } };
             setError(axiosError.response.data?.detail || 'Ошибка загрузки данных');
        } else {
            setError('Ошибка загрузки данных');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [position_id]);

  const filteredAndSorted = useMemo(() => {
    let result = [...candidates];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => c.full_name.toLowerCase().includes(term));
    }
    return result.sort((a, b) => {
      if (sortBy === 'match') return b.match_index - a.match_index;
      if (sortBy === 'dynamics') return b.dynamics_score - a.dynamics_score;
      return a.priority - b.priority;
    });
  }, [candidates, searchTerm, sortBy]);

  if (loading) return <LoadingState />;
  if (error) return <div className="p-20 text-center text-red-500 font-medium">{error}</div>;

  return (
    <div className="min-h-screen bg-[#FBFBFE] pb-20">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <button
              onClick={() => navigate('/hr/reserve/positions')}
              className="group mb-6 flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
              К списку должностей
            </button>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
              Кандидаты в резерв
            </h1>
            <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full w-fit">
              <Award size={18} />
              <span className="font-bold tracking-wide uppercase text-xs">{positionName}</span>
            </div>
          </div>

          <div className="hidden lg:flex gap-8 border-l border-slate-200 pl-8">
            <div className="text-right">
              <div className="text-2xl font-black text-slate-900">{candidates.length}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Всего человек</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-emerald-500">
                {candidates.filter(c => c.match_index > 75).length}
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">High Potential</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Поиск по ФИО сотрудника..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="relative">
            <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'match' | 'dynamics' | 'priority')}
              className="pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-[1.25rem] appearance-none focus:ring-4 focus:ring-indigo-500/10 outline-none cursor-pointer font-medium text-slate-700 shadow-sm"
            >
              <option value="match">По соответствию</option>
              <option value="dynamics">По динамике</option>
              <option value="priority">По приоритету</option>
            </select>
          </div>
        </div>

        {filteredAndSorted.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAndSorted.map((candidate) => (
              <CandidateCard key={candidate.employee_id} candidate={candidate} navigate={navigate} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100">
             <div className="text-slate-200 flex justify-center mb-4"><Search size={64} /></div>
             <p className="text-slate-400 text-xl font-medium">Никто не соответствует критериям поиска</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CandidateCard({ candidate, navigate }: { candidate: Candidate, navigate: NavigateFunction }) {
  const isPositive = candidate.dynamics_score >= 0;
  const statusColor = candidate.match_index >= 80 ? 'emerald' : candidate.match_index >= 60 ? 'amber' : 'rose';
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  }[statusColor];

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors}`}>
            Приоритет {candidate.priority}
          </div>
          <div className="text-slate-300 group-hover:text-indigo-200 transition-colors">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer">
            {candidate.full_name}
          </h3>
          <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-tight">
            {candidate.current_position_name}
          </p>
        </div>

        <div className="bg-slate-50/50 rounded-3xl p-5 mb-6 border border-slate-50">
          <div className="flex justify-between items-end mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Соответствие роли</span>
            <span className={`text-2xl font-black ${statusColor === 'emerald' ? 'text-emerald-600' : 'text-slate-900'}`}>
              {candidate.match_index}%
            </span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 bg-gradient-to-r ${
                statusColor === 'emerald' ? 'from-emerald-400 to-teal-500' : 
                statusColor === 'amber' ? 'from-amber-400 to-orange-500' : 'from-rose-400 to-red-500'
              }`}
              style={{ width: `${candidate.match_index}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-2 mb-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Развитие</span>
            <div className={`flex items-center gap-1 text-lg font-black ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {isPositive && '+'}
              {candidate.dynamics_score}%
            </div>
          </div>
          <div className="h-8 w-[1px] bg-slate-100" />
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Потенциал</span>
            <span className={`text-xs font-black uppercase tracking-tight ${statusColor === 'emerald' ? 'text-emerald-600' : 'text-slate-600'}`}>
              {candidate.match_index >= 80 ? 'Высокий' : candidate.match_index >= 60 ? 'Средний' : 'Развитие'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/hr/match/role/${candidate.employee_id}/1`)}
          className="flex-[3] flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          <BarChart3 size={18} />
          Анализ
        </button>
        <button
          onClick={() => confirm('Вы уверены, что хотите исключить сотрудника?')}
          className="flex-1 flex items-center justify-center border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 py-4 rounded-2xl transition-all active:scale-95"
          title="Исключить из резерва"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <p className="text-slate-500 font-bold animate-pulse uppercase text-xs tracking-widest">Анализ кандидатов...</p>
    </div>
  );
}

