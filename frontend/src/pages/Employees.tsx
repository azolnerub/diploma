import { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const statusStyles: Record<string, string> = {
  'Работает': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'В отпуске': 'bg-amber-100 text-amber-700 border border-amber-200',
  'Уволен': 'bg-rose-100 text-rose-700 border border-rose-200',
};

interface Employee {
  id: number;
  full_name: string;
  position_name: string;
  department_name: string;
  hire_date: string;
  status: string;
}

export default function Employees() {
  const { user } = useAuth(); 
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Employee[]>('employees/');
      setEmployees(res.data);
    } catch (err: unknown) {
      setError('Не удалось загрузить список сотрудников');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = !selectedDepartment || emp.department_name === selectedDepartment;
      const matchesPos = !selectedPosition || emp.position_name === selectedPosition;
      return matchesSearch && matchesDept && matchesPos;
    });
  }, [employees, searchTerm, selectedDepartment, selectedPosition]);

  const allDepartments = Array.from(new Set(employees.map(e => e.department_name))).filter(Boolean);
  const allPositions = Array.from(new Set(employees.map(e => e.position_name))).filter(Boolean);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;
    try {
      await api.delete(`employees/${id}/delete/`);
      loadEmployees();
    } catch {
      alert('Ошибка при удалении');
    }
  };

  const handleEdit = (id: number) => navigate(`/hr/edit/${id}`);
  const handleViewProfile = (id: number) => navigate(`/hr/profile/${id}`);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
  
  if (error) return <div className="p-8 text-rose-600 bg-rose-50 rounded-xl border border-rose-100">{error}</div>;

  // Вид для обычного сотрудника
  if (user?.role === 'employee') {
    const me = employees[0]; // Предполагаем, что API возвращает только его данные
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <div className="bg-indigo-600 p-8 text-white">
            <h2 className="text-3xl font-black">Ваш профиль</h2>
            <p className="opacity-80">Личная карточка сотрудника</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-slate-500 font-medium">ФИО</span>
              <span className="text-slate-900 font-bold text-lg">{me?.full_name || '—'}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-slate-500 font-medium">Должность</span>
              <span className="text-slate-700 font-semibold">{me?.position_name || '—'}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-slate-500 font-medium">Отдел</span>
              <span className="text-slate-700 font-semibold">{me?.department_name || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Статус</span>
              <span className={`px-4 py-1 rounded-full text-sm font-bold ${statusStyles[me?.status] || 'bg-slate-100 text-slate-600'}`}>
                {me?.status || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Реестр персонала</h2>
        <button 
          onClick={loadEmployees} 
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95"
        >
          <span>🔄</span> Обновить данные
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200 flex gap-4 flex-wrap items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Поиск</label>
          <input
            type="text"
            placeholder="Введите ФИО..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="min-w-[200px]">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Департамент</label>
          <select
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">Все отделы</option>
            {allDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
        </div>

        <div className="min-w-[200px]">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Должность</label>
          <select
            value={selectedPosition}
            onChange={e => setSelectedPosition(e.target.value)}
            className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">Все должности</option>
            {allPositions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
        </div>

        <button 
          onClick={() => { setSearchTerm(''); setSelectedDepartment(''); setSelectedPosition(''); }} 
          className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
        >
          Сбросить
        </button>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Сотрудник</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Должность / Отдел</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Принят</th>
              <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Статус</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEmployees.map(emp => (
              <tr key={emp.id} className="group hover:bg-indigo-50/30 transition-colors">
                <td className="px-8 py-5">
                  <button 
                    onClick={() => handleViewProfile(emp.id)}
                    className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-lg block text-left"
                  >
                    {emp.full_name}
                  </button>
                </td>
                <td className="px-6 py-5">
                  <p className="font-semibold text-slate-700">{emp.position_name || '—'}</p>
                  <p className="text-xs text-slate-400 font-medium">{emp.department_name || '—'}</p>
                </td>
                <td className="px-6 py-5 text-slate-500 font-medium">{emp.hire_date}</td>
                <td className="px-6 py-5 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider inline-block min-w-[100px] ${statusStyles[emp.status] || 'bg-slate-100 text-slate-500'}`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {user?.role === 'hr' && (
                      <>
                        <button 
                          onClick={() => handleEdit(emp.id)} 
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(emp.id)} 
                          className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all"
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredEmployees.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-slate-400 font-medium">По вашему запросу сотрудники не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}
