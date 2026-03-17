import { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const statusStyles: Record<string, string> = {
  'Работает': 'bg-green-100 text-green-700',
  'В отпуске': 'bg-yellow-100 text-yellow-700',
  'Уволен': 'bg-red-100 text-red-700',
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
  useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

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
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, selectedDepartment]);

  const allDepartments = Array.from(new Set(employees.map(e => e.department_name))).filter(Boolean);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;
    
    try {
      await api.delete(`employees/${id}/delete/`);
      alert('Сотрудник удалён');
      loadEmployees();
    } catch {
      alert('Ошибка при удалении сотрудника');
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/hr/profile/${id}`);
  };

  if (loading) return <div className="p-8 text-center text-xl">Загрузка сотрудников...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Список сотрудников</h2>
        <button onClick={loadEmployees} className="px-5 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200">
          Обновить
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white p-5 rounded-xl shadow mb-6 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Поиск по ФИО..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />

        <select
          value={selectedDepartment}
          onChange={e => setSelectedDepartment(e.target.value)}
          className="px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Все отделы</option>
          {allDepartments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <button onClick={() => {setSearchTerm(''); setSelectedDepartment('');}} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg">
          Сбросить
        </button>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left">ФИО</th>
              <th className="px-6 py-4 text-left">Должность</th>
              <th className="px-6 py-4 text-left">Отдел</th>
              <th className="px-6 py-4 text-left">Дата приёма</th>
              <th className="px-6 py-4 text-left">Статус</th>
              <th className="px-6 py-4 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50 border-t">
                <td className="px-6 py-5 font-medium">{emp.full_name}</td>
                <td className="px-6 py-5">{emp.position_name || '—'}</td>
                <td className="px-6 py-5">{emp.department_name || '—'}</td>
                <td className="px-6 py-5">{emp.hire_date}</td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusStyles[emp.status] || 'bg-gray-100 text-gray-600'}`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right space-x-4">
                  <button onClick={() => handleEdit(emp.id)} className="text-indigo-600 hover:underline">Редактировать</button>
                  <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:underline">Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredEmployees.length === 0 && (
          <div className="p-12 text-center text-gray-500">По вашему запросу ничего не найдено</div>
        )}
      </div>
    </div>
  );
}