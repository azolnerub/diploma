import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface Competency {
  id: number;
  name: string;
  description: string;
}

interface Evaluation {
  id: number;
  competency_id: number;
  competency_name: string;
  value: number;
  date: string;
  comment: string;
}

interface Employee {
    full_name: string;
    position_name: string;
    department_name: string;
    status: string;
}

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [selectedCompetency, setSelectedCompetency] = useState('');
  const [value, setValue] = useState(3);
  const [comment, setComment] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [empRes, evalRes, compRes] = await Promise.all([
          api.get(`employees/${id}/`),
          api.get(`employees/${id}/evaluations/`), 
          api.get('competencies/'),
        ]);

        setEmployee(empRes.data);
        setEvaluations(evalRes.data);
        setCompetencies(compRes.data);
      } catch {
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleAddCompetency = async () => {
    if (!selectedCompetency) return;

    try {
      await api.post(`employees/${id}/competencies/add/`, {
        competency_id: Number(selectedCompetency),
        value,
        comment,
      });
      // Перезагружаем оценки
      const res = await api.get(`employees/${id}/evaluations/`);
      setEvaluations(res.data);
      setSelectedCompetency('');
      setValue(3);
      setComment('');
    } catch {
      alert('Ошибка добавления компетенции');
    }
  };

  const handleRemoveCompetency = async (competencyId: number) => {
    if (!window.confirm('Удалить эту компетенцию?')) return;

    try {
      await api.delete(`employees/${id}/competencies/${competencyId}/remove/`);
      setEvaluations(prev => prev.filter(item => item.competency_id !== competencyId));
    } catch {
      alert('Ошибка удаления');
    }
  };

  if (loading) return <div className="p-8 text-center">Загрузка...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/hr')} className="mb-6 text-indigo-600 hover:underline">← Назад к списку</button>

      <h1 className="text-3xl font-bold mb-2">{employee?.full_name}</h1>
      <p className="text-gray-600 mb-8">
        {employee?.position_name} • {employee?.department_name} • {employee?.status}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Текущие компетенции и оценки</h2>

          {evaluations.length === 0 ? (
            <p className="text-gray-500">Компетенций пока нет</p>
          ) : (
            <div className="space-y-4">
              {evaluations.map(item => (
                <div key={item.id} className="border-b pb-4 flex justify-between items-start">
                  <div>
                    <p className="font-medium">{item.competency_name}</p>
                    <p className="text-sm text-gray-600">Оценка: {item.value}/5 • {item.date}</p>
                    {item.comment && <p className="text-sm italic mt-1">{item.comment}</p>}
                  </div>
                  <button 
                    onClick={() => handleRemoveCompetency(item.competency_id)} 
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Добавление новой компетенции */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Добавить компетенцию</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Компетенция</label>
              <select
                value={selectedCompetency}
                onChange={e => setSelectedCompetency(e.target.value)}
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Выберите компетенцию</option>
                {competencies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Оценка (1–5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={value}
                onChange={e => setValue(Number(e.target.value))}
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Комментарий</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>

            <button
              onClick={handleAddCompetency}
              disabled={!selectedCompetency}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition"
            >
              Добавить компетенцию
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}