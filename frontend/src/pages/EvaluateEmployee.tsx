import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface Employee {
  id: number;
  full_name: string;
  position_name: string;
  department_name: string;
  status: string;
}

interface Competency {
  id: number;
  name: string;
  description: string;
}

interface Evaluation {
  id: number;
  competency_name: string;
  value: number;
  date: string;
  comment: string;
}
export default function EvaluateEmployee() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<number | string>();
  const [score, setScore] = useState<number>(50); 
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      const [emp, comp, evalRes] = await Promise.all([
        api.get(`employees/${id}/`),
        api.get('competencies/'),
        api.get(`employees/${id}/evaluations/`),
      ]);
      setEmployee(emp.data);
      setCompetencies(comp.data);
      setEvaluations(evalRes.data);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSaveEvaluation = async () => {
    if (!selectedCompetencyId) return alert('Выберите компетенцию');

    await api.post(`employees/${id}/competencies/add/`, {
      competency_id: selectedCompetencyId,
      value: score,
      comment,
    });

    // Обновляем историю
    const res = await api.get<Evaluation[]>(`employees/${id}/evaluations/`);
    setEvaluations(res.data);
    setScore(50);
    setComment('');
  };

  if (loading) return <div className="p-8 text-center">Загрузка...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-6 text-indigo-600 hover:underline flex items-center">← Назад</button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Левая колонка */}
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">{employee?.full_name}</h1>
          <p className="text-gray-600 mb-8">{employee?.position_name} • {employee?.department_name} • {employee?.status}</p>

          <h3 className="text-xl font-semibold mb-4 text-gray-800">Компетенции сотрудника</h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {competencies.map(c => (
              <label key={c.id} className={`flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                selectedCompetencyId === c.id ? 'border-indigo-500 bg-indigo-50' : 'border-transparent bg-gray-50 hover:bg-gray-100'
              }`}>
                <input
                  type="radio"
                  name="competency"
                  checked={selectedCompetencyId === c.id}
                  onChange={() => setSelectedCompetencyId(c.id)}
                  className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <p className="text-sm text-gray-500 leading-tight">{c.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Правая колонка — форма оценки */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">Выставить балл</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Оценка (0–100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={e => setScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-full text-5xl font-bold text-center border-2 border-gray-200 p-6 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-colors text-indigo-600"
              />
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={score} 
                onChange={e => setScore(Number(e.target.value))}
                className="w-full mt-4 accent-indigo-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Комментарий менеджера</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Опишите сильные стороны или области для роста..."
                className="w-full h-32 border-2 border-gray-200 p-4 rounded-xl focus:border-indigo-500 outline-none transition-colors resize-none"
              />
            </div>

            <button
              onClick={handleSaveEvaluation}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
            >
              Сохранить результат
            </button>
          </div>

          {/* История оценок */}
          <div className="mt-12">
            <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">История последних оценок</h4>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {evaluations.length === 0 ? (
                <p className="text-gray-400 italic text-center py-4">Оценок пока не зафиксировано</p>
              ) : (
                evaluations.map(ev => (
                  <div key={ev.id} className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-700">{ev.competency_name}</span>
                      <span className="text-xl font-black text-indigo-600">{ev.value}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-sm text-gray-600 italic flex-1 mr-4">{ev.comment || 'Без комментария'}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{ev.date}</p>
                    </div>
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