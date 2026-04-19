import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Employee {
  id: number;
  full_name: string;
  position_name: string;
  department_name: string;
  status: string;
}

export default function EvaluateList() {
  const navigate = useNavigate();
  const {user, loading: authloading} = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authloading) return;
    api.get<Employee[]>('employees/') 
      .then(res => {
        const filtered = res.data.filter(emp => emp.id !== user?.id);
        setEmployees(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.id]);

  if (loading || authloading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Загрузка данных...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-slate-900">Оценка компетенций сотрудников</h1>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">ФИО</th>
              <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Должность</th>
              <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-8 py-5 font-bold text-slate-900 text-lg">{emp.full_name}</td>
                <td className="px-6 py-5 text-slate-600 font-medium">{emp.position_name || '—'}</td>
                <td className="px-6 py-5">
                  <span className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-full ${
                    emp.status === 'Работает' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <button
                    onClick={() => navigate(`/hr/evaluate/${emp.id}`)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                  >
                    Оценить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {employees.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-4xl mb-4">👥</p>
            <p className="text-slate-400 font-medium text-lg">В вашем отделе пока нет сотрудников</p>
            </div>
        )}
      </div>
    </div>
  );
}
