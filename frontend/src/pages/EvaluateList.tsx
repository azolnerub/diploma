import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

interface Employee {
  id: number;
  full_name: string;
  position_name: string;
  department_name: string;
  status: string;
}

export default function EvaluateList() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Employee[]>('employees/')  // бэкенд уже фильтрует по отделу руководителя
      .then(res => {
        setEmployees(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Загрузка сотрудников отдела...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Оценка компетенций сотрудников</h1>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left">ФИО</th>
              <th className="px-6 py-4 text-left">Должность</th>
              <th className="px-6 py-4 text-left">Статус</th>
              <th className="px-6 py-4 text-right">Действие</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-5 font-medium">{emp.full_name}</td>
                <td className="px-6 py-5">{emp.position_name || '—'}</td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    emp.status === 'Работает' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <button
                    onClick={() => navigate(`/hr/evaluate/${emp.id}`)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg"
                  >
                    Оценить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {employees.length === 0 && (
          <div className="p-12 text-center text-gray-500">В вашем отделе пока нет сотрудников</div>
        )}
      </div>
    </div>
  );
}