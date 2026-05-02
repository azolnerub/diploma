import { useEffect, useState, useMemo, useRef } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Users, ChevronRight, Briefcase, Search, X, ChevronDown, Filter } from 'lucide-react';

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
  status: string;
  role: string;
}

export default function EvaluateList() {
  const navigate = useNavigate();
  const { user, loading: authloading } = useAuth();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
    const [nameSearch, setNameSearch] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [selectedPos, setSelectedPos] = useState<string | null>(null);
  const [showPosList, setShowPosList] = useState(false);
  
  const posRef = useRef<HTMLDivElement>(null);

  // Загрузка данных
  useEffect(() => {
    if (authloading || !user) return;

    api.get<Employee[]>('employees/')
    .then(res => {
      const filtered = res.data.filter(emp => {
        if (emp.id === user.id) return false;

        if (user.role === 'manager') {
          const forbiddenRoles = ['manager', 'director'];
          return !forbiddenRoles.includes(emp.role);
        }

        if (user.role === 'director') {
          return emp.role === 'manager';
        }
        return true;
      });
      setEmployees(filtered);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, [user, authloading])
    

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (posRef.current && !posRef.current.contains(event.target as Node)) {
        setShowPosList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Фильтрация должностей
  const uniquePositions = useMemo(() => {
    const positions = employees.map(e => e.position_name).filter(Boolean);
    return Array.from(new Set(positions)).sort();
  }, [employees]);

  // Фильтрация списка сотрудников
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchName = emp.full_name.toLowerCase().includes(nameSearch.toLowerCase());
      const matchPos = selectedPos 
        ? emp.position_name === selectedPos 
        : emp.position_name.toLowerCase().includes(posSearch.toLowerCase());
      return matchName && matchPos;
    });
  }, [employees, nameSearch, posSearch, selectedPos]);

  if (loading || authloading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-4">
            <button 
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Назад
            </button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                <Users size={28} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Оценка команды</h1>
            </div>
          </div>
          
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center min-w-[140px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Найдено</p>
            <p className="text-2xl font-black text-indigo-600">{filteredEmployees.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Поиск по ФИО */}
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Поиск по ФИО сотрудника..."
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[24px] shadow-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 placeholder:text-slate-400"
            />
            {nameSearch && (
              <button onClick={() => setNameSearch('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-colors">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Поиск по должности */}
          <div className="relative" ref={posRef}>
            <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Фильтр по должности..."
              autoComplete="off"
              value={showPosList ? posSearch : (selectedPos || posSearch)}
              onFocus={() => { setShowPosList(true); setPosSearch(''); }}
              onChange={(e) => { setPosSearch(e.target.value); setSelectedPos(null); }}
              className="w-full pl-14 pr-12 py-5 bg-white border border-slate-100 rounded-[24px] shadow-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 placeholder:text-slate-400 text-ellipsis"
            />
            <ChevronDown className={`absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showPosList ? 'rotate-180' : ''}`} size={20} />
            
            {showPosList && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-[24px] shadow-2xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 p-2">
                <div 
                  onMouseDown={() => { setSelectedPos(null); setPosSearch(''); setShowPosList(false); }}
                  className="px-5 py-3 hover:bg-slate-50 rounded-xl cursor-pointer text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center justify-between"
                >
                  Все должности <Filter size={14} />
                </div>
                <div className="h-px bg-slate-50 my-2 mx-3"></div>
                {uniquePositions
                  .filter(p => p.toLowerCase().includes(posSearch.toLowerCase()))
                  .map((pos, idx) => (
                    <div 
                      key={idx}
                      onMouseDown={(e) => { e.preventDefault(); setSelectedPos(pos); setPosSearch(pos); setShowPosList(false); }}
                      className="px-5 py-4 hover:bg-indigo-50 rounded-xl cursor-pointer text-sm font-bold text-slate-600 transition-colors flex items-center gap-3"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedPos === pos ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                      {pos}
                    </div>
                  ))}
                {uniquePositions.filter(p => p.toLowerCase().includes(posSearch.toLowerCase())).length === 0 && (
                  <div className="px-5 py-8 text-center text-slate-400 text-xs font-bold">Ничего не найдено</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Список сотрудников */}
        <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden transition-all">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-6 text-left text-[12px] font-black text-slate-500 uppercase tracking-widest">Сотрудник</th>
                <th className="hidden lg:table-cell px-10 py-6 text-left text-[12px] font-black text-slate-500 uppercase tracking-widest">Должность</th>
                <th className="px-10 py-6 text-left text-[12px] font-black text-slate-500 uppercase tracking-widest">Статус</th>
                <th className="px-10 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="group hover:bg-slate-50/80 transition-all">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm group-hover:scale-110 transition-transform duration-300">
                        {emp.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                          {emp.full_name}
                        </p>
                        <p className="lg:hidden text-xs text-slate-500 font-bold mt-1">{emp.position_name}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="hidden lg:table-cell px-10 py-7">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Briefcase size={16} className="text-slate-300" />
                      <span className="font-bold text-sm tracking-tight">{emp.position_name || '—'}</span>
                    </div>
                  </td>

                  <td className="px-10 py-7">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusStyles[emp.status] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      {emp.status}
                    </span>
                  </td>

                  <td className="px-10 py-7 text-right">
                    <button
                      onClick={() => navigate(`/evaluate/${emp.id}`)}
                      className="inline-flex items-center gap-2 bg-white text-slate-900 border-2 border-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                      <span>Оценить</span>
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEmployees.length === 0 && (
            <div className="py-32 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Совпадений не найдено</h3>
              <p className="text-slate-400 font-bold max-w-xs px-6">Попробуйте изменить параметры поиска или сбросить фильтры.</p>
              {(nameSearch || selectedPos || posSearch) && (
                 <button 
                  onClick={() => { setNameSearch(''); setSelectedPos(null); setPosSearch(''); }}
                  className="mt-6 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline"
                 >
                   Сбросить всё
                 </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}