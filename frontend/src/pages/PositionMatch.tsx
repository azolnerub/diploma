import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface BreakdownItem {
  competency_name: string;
  required: number;
  current: number;
  gap: number;
  weight: number;
}

interface MatchData {
  employee_id: number;
  employee_name: string;
  target_position: string;
  target_department: string;
  match_index: number;
  coverage: number;
  breakdown: BreakdownItem[];
}

export default function PositionMatch() {
  const { employee_id, position_id } = useParams<{ employee_id: string; position_id: string }>();
  const navigate = useNavigate();

  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!employee_id || !position_id) return;

    api.get<MatchData>(`employees/${employee_id}/match/${position_id}/`)
      .then(res => setMatchData(res.data))
      .catch(err => {
        const msg = err.response?.data?.detail || 'Не удалось загрузить анализ';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [employee_id, position_id]);

  if (loading) return <div className="p-12 text-center text-lg">Загрузка анализа...</div>;
  if (error) return <div className="p-12 text-rose-600 text-center text-lg">{error}</div>;
  if (!matchData) return <div className="p-12 text-center">Данные не найдены</div>;

  const { match_index, coverage, breakdown, employee_name, target_position, target_department } = matchData;

  const getStatus = (score: number) => {
    if (score >= 80) return { text: "Отличное соответствие", color: "bg-emerald-100 text-emerald-700" };
    if (score >= 60) return { text: "Хорошее соответствие", color: "bg-amber-100 text-amber-700" };
    return { text: "Требуется развитие", color: "bg-rose-100 text-rose-700" };
  };

  const status = getStatus(match_index);

  return (
    <div className="max-w-5xl mx-auto p-8">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium">
        ← Назад
      </button>

      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900">Анализ соответствия</h1>
        <p className="text-slate-500 mt-3 text-lg">
          {employee_name} → <span className="font-semibold">{target_position}</span> 
          <span className="text-slate-400"> ({target_department})</span>
        </p>
      </div>

      {/* Главный результат */}
      <div className="bg-white rounded-3xl p-12 shadow-xl text-center mb-12">
        <div className="text-[110px] font-black leading-none text-indigo-600 mb-2">
          {match_index}<span className="text-5xl">%</span>
        </div>
        <p className="text-2xl font-medium text-slate-700 mb-6">Индекс соответствия должности</p>
        <div className={`inline-block px-8 py-3 rounded-2xl text-lg font-bold ${status.color}`}>
          {status.text}
        </div>

        <div className="mt-8 text-sm text-slate-500">
          Покрытие компетенций: <span className="font-bold text-slate-700">{coverage}%</span>
        </div>
      </div>

      {/* Разбор */}
      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold mb-8">Разбор по компетенциям</h2>
        
        <div className="space-y-6">
          {breakdown.map((item, idx) => {
            const progress = Math.min((item.current / (item.required || 1)) * 100, 100);
            const isMissing = item.current === 0;

            return (
              <div key={idx} className="border border-slate-100 rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-semibold text-lg">{item.competency_name}</p>
                    {isMissing && <p className="text-rose-500 text-sm font-medium">Компетенция не оценена</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-sm">Вес {item.weight}</span><br />
                    <span className="font-bold text-xl">
                      {item.current} <span className="text-slate-400">/ {item.required}</span>
                    </span>
                  </div>
                </div>

                <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div 
                    className={`h-full transition-all duration-700 ${isMissing ? 'bg-rose-300' : 'bg-indigo-600'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {item.gap > 0 && (
                  <p className="text-rose-600 text-sm font-medium">Не хватает {item.gap} баллов до требуемого уровня</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
