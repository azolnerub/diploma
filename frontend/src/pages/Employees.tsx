import { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Search, Filter, User, Briefcase, Calendar, MoreHorizontal, RefreshCcw, UserPlus } from 'lucide-react';

const statusStyles: Record<string, string> = {
  'Работает': 'bg-emerald-50 text-emerald-600',
  'В отпуске': 'bg-amber-50 text-amber-600',
  'Уволен': 'bg-rose-50 text-rose-600',
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
    if (!window.confirm('Удалить сотрудника из системы?')) return;
    try {
      await api.delete(`employees/${id}/delete/`);
      loadEmployees();
    } catch {
      alert('Ошибка при удалении');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Загрузка...</p>
    </div>
  );
  
  if (error) return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-rose-50 border border-rose-100 rounded-[2rem] text-center">
      <p className="text-rose-600 font-bold mb-4">{error}</p>
      <button onClick={loadEmployees} className="flex items-center gap-2 mx-auto px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold">
        <RefreshCcw size={16}/> Повторить попытку
      </button>
    </div>
    );

  // Вид для сотрудника
  if (user?.role === 'employee') {
    const me = employees[0];
    return (
      <div className="max-w-xl mx-auto mt-10 p-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 overflow-hidden border border-slate-50">
          <div className="bg-indigo-600 p-10 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mb-6">
              <User size={40} className="text-white"/>
              </div>
              <h2 className="text-3xl font-black mb-1">Ваш профиль</h2>
              <p className="text-indigo-100 font-medium">Центр управления карьерой</p>
            </div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          <div className="p-10 space-y-8">
            <ProfileItem label="ФИО" value={me?.full_name}/>
            <ProfileItem label="Должность" value={me?.position_name}/>
            <ProfileItem label="Отдел" value={me?.department_name}/>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Статус</span>
              <span className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider border ${statusStyles[me?.status] || 'bg-slate-100'}`}>{me?.status || 'Не определен'}</span>
            </div>
          </div>
        </div>
      </div>
  );
}

return (
  <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
      <div>
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">Команда</h2>
        <p className="text-slate-400 font-medium">Управление доступом и структурой персонала</p>
      </div>
      {user?.role === 'hr' && (
        <button
        onClick={() => navigate('/hr')}
        className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95">
          <UserPlus size={20}/> Добавить сотрудника
        </button>
      )}
    </div>

    {/*Фильтры*/}
    <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-2 mb-10">
      <div className="relative flex-[2]">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
        <input
        type="text"
        placeholder="Поиск по ФИО сотрудника..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full pl-14 pr-6 py-5 bg-transparent border-none focus:ring-0 font-bold text-slate-700 placeholder:text-slate-300"/>
      </div>

      <div className="h-10 w-px bg-slate-100 hidden lg:block self-center"></div>

      <div className="flex flex-col md:flex-row flex-[3] gap-2">
        {user?.role === 'hr' && (
          <div className="relative flex-1">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
            <select 
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            className="w-full pl-12 pr-4 py-5 bg-transparent border-none focus:ring-0 font-bold text-slate-600 appearance-none cursor-pointer">
              <option value="">Все отделы</option>
              {allDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>
        )}

        <div className="relative flex-1">
          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
          <select
          value={selectedPosition}
          onChange={e => setSelectedPosition(e.target.value)}
          className="w-full pl-12 pr-4 py-5 bg-transparent border-none focus:ring-0 font-bold text-slate-600 appearance-none cursor-pointer">
            <option value="">Все должности</option>
            {allPositions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
        </div>

        <button
        onClick={() => {setSearchTerm(''); setSelectedDepartment(''); setSelectedPosition('');}}
        className="px-8 py-4 bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-colors"
        >Сбросить
        </button>
      </div>
    </div>

    {/*Список сотрудников*/}
    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-50">
            <th className="pl-10 pr-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Сотрудник</th>
            <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Должность</th>
            <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Дата приема</th>
            <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Статус</th>
            {user?.role !== 'manager' && (
              <th className="pl-6 pr-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Действия</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {filteredEmployees.map((emp) => (
            <tr key={emp.id} className="group hover:bg-slate-50/80 transition-all duration-300">
              <td className="pl-10 pr-6 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm group-hover:scale-110 transition-transform">
                    {emp.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-lg leading-tight">{emp.full_name}</div>
                    <div className="text-xs font-bold text-indigo-500 uppercase tracking-tighter mt-0.5">{emp.department_name}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-6">
                <div className="font-bold text-slate-700">{emp.position_name || '-'}</div>
              </td>
              <td className="px-6 py-6">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                  <Calendar size={14}/>
                  {new Date(emp.hire_date).toLocaleDateString('ru-RU')}
                </div>
              </td>
              <td className="px-6 py-6 text-center">
                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusStyles[emp.status] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>{emp.status}</span>
              </td>
              {user?.role !== 'manager' && (
                <td className="pl-6 pr-10 py-6 text-right">
                  <div className="flex justify-end items-center gap-1 opacity-100 transition-opacity">
                    <button 
                    onClick={() => navigate(`/hr/edit/${emp.id}`)}
                    className="p-3 text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-lg rounded-xl transition-all">
                      <Edit2 size={18}/>
                    </button>
                    <button
                    onClick={() => handleDelete(emp.id)}
                    className="p-3 text-slate-400 hover:bg-white hover:text-rose-600 hover:shadow-lg rounded-xl transition-all">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {filteredEmployees.length === 0 && (
      <div className="py-32 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <Search size={32} className="text-slate-200"/>
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-1">Сотрудники не найдены</h3>
        <p className="text-slate-400 font-medium">Попробуйте изменить параметры фильтрации</p>
      </div>
    )}
    </div>
  </div>
);
}

function ProfileItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-end border-b border-slate-100 pb-4">
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value || '—'}</p>
      </div>
      <div className="text-indigo-50">
        <MoreHorizontal size={24} />
      </div>
    </div>
  );
}

