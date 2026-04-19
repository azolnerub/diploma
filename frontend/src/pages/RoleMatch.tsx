import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Info, Layers, Zap} from 'lucide-react';
import api from '../api/axios';

interface BreakdownItem {
  competency_name: string;
  current: number;
  required: number;
  weight: number;
  ratio: number;
  is_key: boolean;
  is_missing: boolean;
  source: 'position' | 'role';
}

interface PositionMatch {
  position_id: number;
  position_name: string;
  match_index: number;
}

interface Recommendation {
  competency_name: string;
  gap: number;
}

interface RoleMatchData {
  role_name: string;
  role_match_index: number;
  coverage: number;
  positions: PositionMatch[];
  recommendations: Recommendation[];
}

interface PositionAccordionProps {
  pos: PositionMatch;
  details: BreakdownItem[] | undefined;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function RoleMatch() {
  const { employee_id, role_id } = useParams<{ employee_id: string; role_id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<RoleMatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPosition, setExpandedPosition] = useState<number | null>(null);
  const [positionDetails, setPositionDetails] = useState<Record<number, BreakdownItem[]>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<RoleMatchData>(`employees/${employee_id}/match/role/${role_id}/`);
        setData(res.data);
      } catch (err: unknown) { // ✅ Заменили any на unknown
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosError = err as { response: { data?: { detail?: string } } };
          setError(axiosError.response.data?.detail || 'Ошибка загрузки анализа');
        } else {
          setError('Ошибка загрузки анализа');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [employee_id, role_id]);


  const togglePosition = async (positionId: number) => {
    if (expandedPosition === positionId) {
      setExpandedPosition(null);
      return;
    }
    setExpandedPosition(positionId);
    if (!positionDetails[positionId]) {
      try {
        const res = await api.get(`employees/${employee_id}/match/role/${role_id}/position/${positionId}/`);
        setPositionDetails(prev => ({ ...prev, [positionId]: res.data.breakdown || [] }));
      } catch (err) { console.error(err); }
    }
  };

  if (loading) return <AnalysisLoader />;
  if (error || !data) return <div className="p-20 text-center text-red-500 font-bold">{error}</div>;

  const score = Math.round(data.role_match_index || 0);
  const statusColor = score >= 80 ? 'emerald' : score >= 60 ? 'amber' : 'rose';

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        
        <button 
          onClick={() => navigate(-1)} 
          className="group mb-8 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Вернуться в резерв
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          
          <div className="relative bg-slate-900 p-10 md:p-14 overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  Анализ роли:<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    {data.role_name}
                  </span>
                </h1>
              </div>

              <div className="flex items-center gap-6 bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10">
                <div className="text-right">
                  <div className={`text-6xl font-black leading-none text-${statusColor}-400`}>
                    {score}%
                  </div>
                </div>
                <div className="h-12 w-[1px] bg-white/10" />
                <div className="max-w-[120px] text-[10px] text-slate-300 leading-relaxed font-medium">
                  Общий индекс соответствия
                </div>
              </div>
            </div>
          </div>

          {data.recommendations?.length > 0 && (
            <div className="bg-amber-50/50 border-b border-amber-100 p-8 md:px-14">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                  <Zap size={20} />
                </div>
                <h3 className="font-black text-amber-900 text-sm uppercase tracking-wider">Приоритетные зоны развития:</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.recommendations.map((rec: Recommendation, i: number) => (
                  <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-amber-200 shadow-sm">
                    <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                    <span className="text-sm font-semibold text-slate-700">
                      Подтянуть <span className="text-indigo-600">«{rec.competency_name}»</span>
                      <span className="ml-2 text-xs font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">
                        -{rec.gap}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-8 md:p-14">
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <Layers className="text-indigo-600" />
                Составляющие должности
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
              {data.positions.map((pos) => (
                <PositionAccordion 
                  key={pos.position_id} 
                  pos={pos} 
                  details={positionDetails[pos.position_id]}
                  isExpanded={expandedPosition === pos.position_id}
                  onToggle={() => togglePosition(pos.position_id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PositionAccordion({ pos, details, isExpanded, onToggle }: PositionAccordionProps) {
  return (
    <div className={`
      border rounded-[2rem] transition-all duration-300 overflow-hidden
      ${isExpanded ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}
    `}>
      <div 
        onClick={onToggle}
        className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center cursor-pointer gap-6"
      >
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className={`p-4 rounded-2xl ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'} transition-colors`}>
            <Info size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">{pos.position_name}</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Анализ соответствия</span>
          </div>
        </div>

        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <span className="text-4xl font-black text-indigo-600">{pos.match_index}%</span>
          </div>
          <div className={`p-2 rounded-full ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-8 md:px-8 md:pb-10 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {details?.map((item: BreakdownItem, i: number) => (
              <CompetencyDetailCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompetencyDetailCard({ item }: { item: BreakdownItem }) {
  const isDanger = item.ratio < 60;
  return (
    <div className={`
      p-5 rounded-2xl border transition-all
      ${item.is_key ? 'border-rose-200 bg-rose-50/50' : 'border-white bg-white shadow-sm'}
    `}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <span className="font-black text-slate-900 text-sm leading-tight">{item.competency_name}</span>
          <div className="flex items-center gap-2 mt-1">
            {item.is_key && (
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                Ключевая
              </span>
            )}
          </div>
        </div>
        <div className={`text-xl font-black ${isDanger ? 'text-rose-600' : 'text-emerald-600'}`}>
          {Math.round(item.ratio)}%
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
          <span>{item.current} Текущий</span>
          <span>{item.required} Требуемый</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${isDanger ? 'bg-rose-500' : 'bg-emerald-500'}`}
            style={{ width: `${item.ratio}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function AnalysisLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-20 h-20 border-8 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-6" />
      <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Загрузка анализа...</h2>
    </div>
  );
}
