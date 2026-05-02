import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Search, Filter, Briefcase, ArrowLeft, Calendar, UserPlus, ChevronDown } from 'lucide-react';

const statusStyles: Record<string, string> = {
  'Работает': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'В отпуске': 'bg-amber-50 text-amber-600 border-amber-100',
  'Уволен': 'bg-rose-50 text-rose-600 border-rose-100',
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
  const [deptSearch, setDeptSearch] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState<string | null>(null);
  
  const [showDeptList, setShowDeptList] = useState(false);
  const [showPosList, setShowPosList] = useState(false);

  const deptRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<HTMLDivElement>(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Employee[]>('employees/');
      setEmployees(res.data);
    } catch {
      setError('Не удалось загрузить список сотрудников');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) setShowDeptList(false);
      if (posRef.current && !posRef.current.contains(event.target as Node)) setShowPosList(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allDepartments = useMemo(() => 
    Array.from(new Set(employees.map(e => e.department_name))).filter(Boolean).sort()
  , [employees]);

  const allPositions = useMemo(() => {
    const relevantEmployees = selectedDept
      ? employees.filter(e => e.department_name === selectedDept)
      : employees;
    
    return Array.from(new Set(relevantEmployees.map(e => e.position_name))).filter(Boolean).sort();
  },[employees, selectedDept]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept ? emp.department_name === selectedDept : emp.department_name.toLowerCase().includes(deptSearch.toLowerCase());
      const matchesPos = selectedPos ? emp.position_name === selectedPos : emp.position_name.toLowerCase().includes(posSearch.toLowerCase());
      return matchesSearch && matchesDept && matchesPos;
    });
  }, [employees, searchTerm, deptSearch, posSearch, selectedDept, selectedPos]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить сотрудника из системы?')) return;
    try {
      await api.delete(`employees/${id}/delete/`);
      loadEmployees();
    } catch {
      alert('Ошибка при удалении');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDeptSearch('');
    setPosSearch('');
    setSelectedDept(null);
    setSelectedPos(null);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Загрузка...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors mb-8"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/>
        Назад
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">Команда</h2>
          <p className="text-slate-400 font-medium">Управление доступом и структурой персонала</p>
        </div>
        {user?.role === 'hr' && (
          <button
            onClick={() => navigate('/hr')}
            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            <UserPlus size={20}/> Добавить сотрудника
          </button>
        )}
      </div>

      {/* Панель фильтров */}
      <div className="bg-white p-3 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col lg:flex-row gap-4 mb-10">
        <div className="relative flex-[2]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input
            type="text"
            placeholder="Поиск по ФИО..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-100 font-bold text-slate-700 placeholder:text-slate-300 transition-all"
          />
        </div>

        {['hr', 'director'].includes(user?.role || '') && (
          <div className="relative flex-1" ref={deptRef}>
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
            <input 
              type="text"
              placeholder="Отдел..."
              autoComplete="off"
              value={showDeptList ? deptSearch : (selectedDept || deptSearch)}
              onFocus={() => { setShowDeptList(true); setShowPosList(false); setDeptSearch(''); }}
              onChange={(e) => { setDeptSearch(e.target.value); setSelectedDept(null); }}
              className="w-full pl-12 pr-10 py-4 bg-slate-50/50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-100 font-bold text-slate-600 placeholder:text-slate-300 cursor-pointer"
            />
            <ChevronDown size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showDeptList ? 'rotate-180' : ''}`} />
            
            {showDeptList && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl max-h-60 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2">
                <div onMouseDown={() => { setSelectedDept(null); setDeptSearch(''); setShowDeptList(false); }} className="px-4 py-3 hover:bg-slate-50 rounded-2xl cursor-pointer text-[10px] font-black uppercase text-indigo-600">Все отделы</div>
                {allDepartments.filter(d => d.toLowerCase().includes(deptSearch.toLowerCase())).map(dept => (
                  <div key={dept} onMouseDown={() => { setSelectedDept(dept); setDeptSearch(dept); setSelectedPos(null); setPosSearch(''); setShowDeptList(false); }} className="px-4 py-3 hover:bg-indigo-50 rounded-2xl cursor-pointer text-sm font-bold text-slate-600 transition-colors">
                    {dept}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="relative flex-1" ref={posRef}>
          <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
          <input 
            type="text"
            placeholder="Должность..."
            autoComplete="off"
            value={showPosList ? posSearch : (selectedPos || posSearch)}
            onFocus={() => { setShowPosList(true); setShowDeptList(false); setPosSearch(''); }}
            onChange={(e) => { setPosSearch(e.target.value); setSelectedPos(null); }}
            className="w-full pl-12 pr-10 py-4 bg-slate-50/50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-100 font-bold text-slate-600 placeholder:text-slate-300 cursor-pointer"
          />
          <ChevronDown size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showPosList ? 'rotate-180' : ''}`} />

          {showPosList && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl max-h-60 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2">
              <div onMouseDown={() => { setSelectedPos(null); setPosSearch(''); setShowPosList(false); }} className="px-4 py-3 hover:bg-slate-50 rounded-2xl cursor-pointer text-[10px] font-black uppercase text-indigo-600">Все должности</div>
              {allPositions.filter(p => p.toLowerCase().includes(posSearch.toLowerCase())).map(pos => (
                <div key={pos} onMouseDown={() => { setSelectedPos(pos); setPosSearch(pos); setShowPosList(false); }} className="px-4 py-3 hover:bg-indigo-50 rounded-2xl cursor-pointer text-sm font-bold text-slate-600 transition-colors">
                  {pos}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={resetFilters}
          className="px-8 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          Сбросить
        </button>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pl-12 pr-6 py-8 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Сотрудник</th>
                <th className="px-6 py-8 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Должность</th>
                <th className="px-6 py-8 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Дата приема</th>
                <th className="px-6 py-8 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Статус</th>
                {user?.role !== 'manager' && (
                  <th className="pl-6 pr-12 py-8 text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Действия</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                  <td className="pl-12 pr-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm group-hover:scale-110 transition-transform">
                        {emp.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{emp.full_name}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight mt-1">{emp.department_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="font-bold text-slate-700">{emp.position_name || '—'}</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                      <Calendar size={14}/>
                      {new Date(emp.hire_date).toLocaleDateString('ru-RU')}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusStyles[emp.status] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      {emp.status}
                    </span>
                  </td>
                  {user?.role !== 'manager' && (
                    <td className="pl-6 pr-12 py-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={() => navigate(`/hr/edit/${emp.id}`)}
                          className="p-3 text-slate-300 hover:bg-white hover:text-indigo-600 hover:shadow-xl rounded-2xl transition-all"
                        >
                          <Edit2 size={18}/>
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-3 text-slate-300 hover:bg-white hover:text-rose-600 hover:shadow-xl rounded-2xl transition-all"
                        >
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