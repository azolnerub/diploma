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
  
  const { user, loading: authLoading } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<number | null>(null);
  const [score, setScore] = useState<number>(50);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return;

      try {
        const empRes = await api.get<Employee>(`employees/${id}/`);
        const targetEmployee = empRes.data;

        if (user?.role === 'director') {
          const isManagerial = targetEmployee.position_name?.toLowerCase().includes('менеджер') || 
                               targetEmployee.position_name?.toLowerCase().includes('руководитель');
          
          if (!isManagerial) {
            alert("Директор может оценивать только руководителей отделов");
            navigate(-1);
            return;
          }
        }

        setEmployee(targetEmployee);

        const [evalRes, profileRes, rolesRes] = await Promise.allSettled([
          api.get<Evaluation[]>(`employees/${id}/evaluations/`),
          api.get<RawPositionCompetency[]>(`positions/${targetEmployee.position_id}/profile/`),
          api.get<RawRoleCompetency[]>(`positions/${targetEmployee.position_id}/competencies-from-roles/`)
        ]);

        if (evalRes.status === 'fulfilled') {
          setEvaluations(evalRes.value.data);
        }

        if (!targetEmployee.position_id) {
          setLoading(false);
          return;
        }

        // Компетенции из профиля должности
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

        // Компетенции из ролей
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

        // Объединение с приоритетом должности
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

        setCompetencies(Array.from(combined.values()));

      } catch (err: any) {
        if (err.response?.status === 403 || err.response?.status === 404) {
          alert("Доступ ограничен или сотрудник не найден");
          navigate(-1);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate, user, authLoading]);

  const handleSaveEvaluation = async () => {
    if (!selectedCompetencyId) return alert("Выберите компетенцию");
    setSaving(true);

    try {
      await api.post(`employees/${id}/competencies/add/`, {
        competency_id: selectedCompetencyId,
        value: score,
        comment: comment.trim() || (user?.role === 'director' ? "Оценка директора" : "Оценка руководителя"),
      });

      const res = await api.get(`employees/${id}/evaluations/`);
      setEvaluations(res.data);

      setScore(50);
      setComment('');
      setSelectedCompetencyId(null);
    } catch {
      alert("Ошибка при сохранении оценки");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <div className="p-10 text-center font-medium text-slate-400">Загрузка данных...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors">
        ← Назад
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{employee?.full_name}</h1>
          <p className="text-xl text-slate-400 mt-2 font-medium">
            {employee?.position_name} <span className="text-slate-200 mx-2">•</span> {employee?.department_name}
          </p>

          <div className="mt-10">
            <h3 className="font-bold mb-5 text-lg uppercase tracking-wider text-slate-500 text-sm">Компетенции для оценки</h3>

            {competencies.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">Для данной позиции компетенции не настроены</p>
              </div>
            ) : (
              <div className="space-y-3">
                {competencies.map(c => {
                  const lastEval = evaluations.find(ev => ev.competency_name === c.name);
                  const isSelected = selectedCompetencyId === c.id;
                  
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCompetencyId(c.id)}
                      className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex justify-between items-start ${
                        isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100' : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`font-bold text-lg ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{c.name}</p>
                        {c.required_level && (
                          <p className="text-xs font-bold text-indigo-400 mt-1 uppercase tracking-tighter">
                            Цель: {c.required_level}%
                          </p>
                        )}
                        {c.description && <p className="text-sm text-slate-500 mt-3 leading-relaxed">{c.description}</p>}
                      </div>

                      <div className="text-right ml-4">
                        {lastEval && <div className="text-3xl font-black text-indigo-600">{lastEval.value}</div>}
                        {c.is_key && (
                          <span className="inline-block mt-2 text-[10px] font-black uppercase bg-rose-100 text-rose-600 px-3 py-1 rounded-full">Ключевая</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 p-10 border border-slate-50 h-fit sticky top-8">
          <h3 className="text-2xl font-black text-slate-900 mb-8">Выставить балл</h3>

          <div className="space-y-10">
            <div>
              <div className="flex justify-between items-end mb-6">
                <span className="font-bold text-slate-400 uppercase text-xs tracking-widest">Уровень владения</span>
                <span className="text-6xl font-black text-indigo-600 tracking-tighter">{score}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={score}
                onChange={e => setScore(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Комментарий {user?.role === 'director' ? 'директора' : 'руководителя'}</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full h-32 bg-slate-50 border-none rounded-[2rem] p-6 focus:ring-2 focus:ring-indigo-100 transition-all resize-none font-medium text-slate-700"
                placeholder="Обоснуйте оценку или дайте рекомендацию..."
              />
            </div>

            <button
              onClick={handleSaveEvaluation}
              disabled={!selectedCompetencyId || saving}
              className="w-full bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-200 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl active:scale-[0.98] uppercase tracking-widest text-sm"
            >
              {saving ? 'Сохранение...' : 'Зафиксировать результат'}
            </button>
          </div>

          <div className="mt-12 border-t border-slate-50 pt-10">
            <h4 className="font-black text-slate-900 mb-6 flex items-center justify-between">
              История оценок 
              <span className="bg-indigo-50 text-indigo-600 text-xs px-4 py-1 rounded-full">{evaluations.length}</span>
            </h4>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {evaluations.length === 0 ? (
                <p className="text-center py-10 text-slate-300 font-medium italic">История пуста</p>
              ) : (
                evaluations.map(ev => (
                  <div key={ev.id} className="bg-slate-50/50 p-6 rounded-[2rem] border border-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-800">{ev.competency_name}</span>
                      <span className="text-2xl font-black text-indigo-600">{ev.value}</span>
                    </div>
                    {ev.comment && <p className="text-sm text-slate-500 font-medium leading-snug">{ev.comment}</p>}
                    <p className="text-[10px] font-bold text-slate-300 mt-4 uppercase tracking-wider">
                      {new Date(ev.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}