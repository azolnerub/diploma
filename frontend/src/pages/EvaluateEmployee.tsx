import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

interface Employee {
  id: number;
  full_name: string;
  position_id?: number;
  position_name?: string;
  department_name?: string;
}

interface Competency {
  id: number;
  name: string;
  description?: string;
  required_level?: number;
  is_key?: boolean;
  source?: 'position' | 'role';
}

interface Evaluation {
  id: number;
  competency_name: string;
  value: number;
  date: string;
  comment: string;
}

interface RawPositionCompetency {
  competency: number;
  competency_name: string;
  description?: string;
  required_level?: string | number;
  is_key?: boolean;
}

interface RawRoleCompetency {
  id: number;
  name: string;
  description?: string;
  required_level?: string | number;
  is_key?: boolean;
}

export default function EvaluateEmployee() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {loading: authloading} = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<number | null>(null);
  const [score, setScore] = useState<number>(50);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      const [empRes, evalRes] = await Promise.all([
        api.get<Employee>(`employees/${id}/`),
        api.get<Evaluation[]>(`employees/${id}/evaluations/`)
      ]);

      setEmployee(empRes.data);

      const realEvals = evalRes.data.filter((ev: Evaluation) => 
        !(ev.comment?.includes("HR") || ev.comment?.includes("добавлена HR"))
      );
      setEvaluations(realEvals);

      const positionId = empRes.data.position_id;
      if (!positionId) {
        setLoading(false);
        return;
      }

      // Загружаем оба источника параллельно
      const [profileRes, rolesRes] = await Promise.allSettled([
        api.get<RawPositionCompetency[]>(`positions/${positionId}/profile/`),
        api.get<RawRoleCompetency[]>(`positions/${positionId}/competencies-from-roles/`)
      ]);

      // 1. Обрабатываем данные из PositionProfile
      const positionProfileComps: Competency[] = profileRes.status === 'fulfilled'  
        ? profileRes.value.data.map((item: RawPositionCompetency) => ({
            id: Number(item.competency),
            name: item.competency_name,
            description: item.description || '',
            required_level: item.required_level ? Number(item.required_level) : undefined,
            is_key: Boolean(item.is_key),
            source: 'position'
          }))
        : [];

      // 2. Обрабатываем данные из ролей
      const roleComps: Competency[] = rolesRes.status === 'fulfilled'
        ? rolesRes.value.data.map((item: RawRoleCompetency) => ({
            id: Number(item.id),
            name: item.name,
            description: item.description || '',
            required_level: item.required_level ? Number(item.required_level) : undefined,
            is_key: Boolean(item.is_key),
            source: 'role'
          }))
        : [];

      const combined = new Map<number, Competency>();

      roleComps.forEach(c => combined.set(c.id, c));

      positionProfileComps.forEach(c => {
        if (combined.has(c.id)) {
          const existing = combined.get(c.id)!;
          combined.set(c.id, {
            ...existing,
            required_level: c.required_level,
            is_key: c.is_key || existing.is_key,
            source: 'position'
          });
        } else {
          combined.set(c.id, c);
        }
      });

      const finalArray = Array.from(combined.values());
      console.log("Итоговый список компетенций:", finalArray);
      setCompetencies(finalArray);

    } catch (err) {
      console.error("Критическая ошибка загрузки:", err);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, [id]);

  if (authloading) return <div className="p-10 text-center">Загрузка пользователя...</div>;

  const handleSaveEvaluation = async () => {
    if (!selectedCompetencyId) return alert("Выберите компетенцию");

    try {
      await api.post(`employees/${id}/competencies/add/`, {
        competency_id: selectedCompetencyId,
        value: score,
        comment: comment.trim() || "Оценка руководителя",
      });

      const res = await api.get(`employees/${id}/evaluations/`);
      const realEvals = res.data.filter((ev: Evaluation) => 
        !(ev.comment?.includes("HR") || ev.comment?.includes("добавлена HR"))
      );
      setEvaluations(realEvals);

      setScore(50);
      setComment('');
      setSelectedCompetencyId(null);
    } catch {
      alert("Ошибка при сохранении оценки");
    }
  };

  if (loading) return <div className="p-10 text-center">Загрузка данных сотрудника...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900">
        ← Назад
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h1 className="text-4xl font-bold">{employee?.full_name}</h1>
          <p className="text-xl text-slate-600 mt-2">
            {employee?.position_name} • {employee?.department_name}
          </p>

          <div className="mt-10">
            <h3 className="font-semibold mb-5 text-lg">Компетенции для оценки</h3>

            {competencies.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                <p className="text-slate-400">Для текущей должности пока нет компетенций</p>
              </div>
            ) : (
              <div className="space-y-3">
                {competencies.map(c => {
                  const existingEval = evaluations.find(ev => ev.competency_name === c.name);
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCompetencyId(c.id)}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-start ${
                        selectedCompetencyId === c.id 
                          ? 'border-indigo-600 bg-indigo-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{c.name}</p>
                        
                        {c.required_level !== undefined && (
                          <p className="text-xs text-slate-500 mt-1">
                            Требуемый уровень: <span className="font-semibold text-indigo-600">{c.required_level}%</span>
                          </p>
                        )}
                        {c.description && (
                          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{c.description}</p>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        {existingEval && (
                          <div className="text-emerald-600 font-bold text-2xl">{existingEval.value}</div>
                        )}
                        {c.is_key && (
                          <span className="inline-block mt-1 text-xs bg-red-100 text-red-600 px-2.5 py-0.5 rounded-full">Ключевая</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-8">Выставить оценку</h3>

          <div className="space-y-8">
            <div>
              <div className="flex justify-between mb-4">
                <span className="font-medium">Уровень владения</span>
                <span className="text-5xl font-black text-indigo-600">{score}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={score}
                onChange={e => setScore(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Комментарий руководителя (необязательно)</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full h-32 border border-slate-200 rounded-2xl p-5 focus:border-indigo-500 resize-y"
                placeholder="Дополнительные замечания или обоснование оценки..."
              />
            </div>

            <button
              onClick={handleSaveEvaluation}
              disabled={!selectedCompetencyId}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition"
            >
              Сохранить оценку
            </button>
          </div>

          <div className="mt-12">
            <h4 className="font-semibold mb-5 flex items-center gap-3">
              История оценок 
              <span className="bg-slate-100 text-slate-500 text-xs px-3 py-1 rounded-full">{evaluations.length}</span>
            </h4>

            {evaluations.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-3xl">
                Оценок пока нет
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {evaluations.map(ev => (
                  <div key={ev.id} className="bg-slate-50 p-5 rounded-2xl">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{ev.competency_name}</span>
                      <span className="text-3xl font-black text-indigo-600">{ev.value}</span>
                    </div>
                    {ev.comment && <p className="text-sm text-slate-600 mt-3">{ev.comment}</p>}
                    <p className="text-xs text-slate-400 mt-4">{new Date(ev.date).toLocaleDateString('ru-RU')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}