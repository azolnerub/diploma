import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Users, Target, ChevronRight } from 'lucide-react';
import api from '../api/axios';

interface PositionWithCandidates {
  id: number;
  name: string;
  department_name: string;
  candidate_count: number;
  avg_match: number;
}

interface RawPositionResponse {
  id: number;
  name: string;
  department_name?: string;
  department?: { name: string };
  candidate_count?: number;
  avg_match?: number;
}


export default function ReservePositionsList() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<PositionWithCandidates[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await api.get<RawPositionResponse[]>('/positions/');
        const formatted: PositionWithCandidates[] = res.data.map((p) => ({
          id: p.id,
          name: p.name,
          department_name: p.department_name || p.department?.name || 'Общий отдел',
          candidate_count: p.candidate_count || 0,
          avg_match: Math.round(p.avg_match || 0)
        }));
        setPositions(formatted);
      } catch (err: unknown) {
        console.error(err);
        setError('Не удалось загрузить список вакансий. Попробуйте обновить страницу.');
      } finally {
        setLoading(false);
      }
    };
    fetchPositions();
  }, []);

  if (error) return <ErrorState message={error} />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        
        {/* Navigation */}
        <button 
          onClick={() => navigate('/reserve')} 
          className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          Назад в кадровый резерв
        </button>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Briefcase size={24} />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Вакансии резерва
            </h1>
          </div>
          <p className="text-lg text-slate-500 max-w-2xl">
            Управляйте потенциалом компании: анализируйте кандидатов и отслеживайте соответствие должностям.
          </p>
        </header>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : positions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {positions.map(pos => (
              <PositionCard key={pos.id} pos={pos} onClick={() => navigate(`/hr/reserve/position/${pos.id}`)} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function PositionCard({ pos, onClick }: { pos: PositionWithCandidates, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Декоративный элемент фона */}
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Briefcase size={80} />
      </div>

      <div className="relative z-10">
        <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider mb-4">
          {pos.department_name}
        </span>
        
        <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-8 group-hover:text-indigo-600 transition-colors">
          {pos.name}
        </h3>

        <div className="flex items-end justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-4xl font-black text-slate-900 flex items-center gap-2">
                {pos.candidate_count}
                <Users className="text-indigo-500" size={24} />
              </span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Кандидатов</span>
            </div>
          </div>

          {pos.avg_match > 0 && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <Target size={16} />
                <span className="text-2xl">{pos.avg_match}%</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 uppercase text-right">Матч</span>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-indigo-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
          Смотреть список
          <ChevronRight size={18} />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-[2rem] p-8 animate-pulse">
      <div className="h-4 w-24 bg-slate-100 rounded mb-4" />
      <div className="h-8 w-full bg-slate-100 rounded mb-10" />
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="h-10 w-12 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
        </div>
        <div className="h-10 w-16 bg-slate-50 rounded" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
      <div className="inline-flex p-6 bg-slate-50 rounded-full text-slate-300 mb-6">
        <Briefcase size={48} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Вакансий пока нет</h2>
      <p className="text-slate-500">Добавьте целевые должности для формирования резерва</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-red-500 mb-4 inline-block p-4 bg-red-50 rounded-full">
          <Target size={40} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">{message}</h2>
        <button onClick={() => window.location.reload()} className="text-indigo-600 font-semibold hover:underline">
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
