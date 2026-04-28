import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, RefreshCw, CheckCircle2, Users, ArrowLeft, ChevronDown, Filter, Briefcase, Search } from 'lucide-react';

interface ReservedPosition {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  full_name: string;
  position_name: string;
  department_name: string;
  department_id: number;
  dynamics_score: number;
  in_reserve: boolean;
  reserved_positions: ReservedPosition[];
  status: string;
}

interface RoleOption {
  id: number;
  name: string;
  department?: number | null;
}

export default function Reserve() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allRoles, setAllRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [nameSearch, setNameSearch] = useState(searchParams.get('q') || '');
  const [posSearch, setPosSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [selectedPos, setSelectedPos] = useState<string | null>(searchParams.get('pos') || null);
  const [selectedDept, setSelectedDept] = useState<string | null>(searchParams.get('dept') || null);
  
  const [showPosList, setShowPosList] = useState(false);
  const [showDeptList, setShowDeptList] = useState(false);

  const posRef = useRef<HTMLDivElement>(null);
  const deptRef = useRef<HTMLDivElement>(null);

  const activeTab = (searchParams.get('tab') as 'all' | 'reserve' | 'positive' | 'negative') || 'all';

  const [selectedRoleForEmployee, setSelectedRoleForEmployee] = useState<Record<number, number>>({});

  useEffect(() => {
    setSelectedPos(null);
    setPosSearch('');
  }, [selectedDept])

  const fetchData = async () => {
    try {
      const [empRes, roleRes] = await Promise.all([
        api.get<Employee[]>('employees/dynamics/'),
        api.get<RoleOption[]>('roles/'),
      ]);
      setEmployees(empRes.data || []);
      setAllRoles(roleRes.data || []);
    } catch (err) {
      console.error("Ошибка загрузки", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (posRef.current && !posRef.current.contains(event.target as Node)) setShowPosList(false);
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) setShowDeptList(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (nameSearch) params.set('q', nameSearch);
    if (selectedPos) params.set('pos', selectedPos);
    if (selectedDept && user?.role === 'hr') params.set('dept', selectedDept);
    if (activeTab !== 'all') params.set('tab', activeTab);
    setSearchParams(params, { replace: true });
  }, [nameSearch, selectedPos, selectedDept, setSearchParams, activeTab, user?.role]);

  const uniquePositions = useMemo(() => { 
    let baseEmployees = employees;
    if (selectedDept) baseEmployees = baseEmployees.filter(e => e.department_name === selectedDept);
    const names = baseEmployees.map(e => e.position_name).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [employees, selectedDept])

  const uniqueDepts = useMemo(() => 
    Array.from(new Set(employees.map(e => e.department_name))).filter(Boolean).sort()
  , [employees]);

  const filteredEmployees = useMemo(() => {
    let result = [...employees];
    
    if (activeTab === 'reserve') result = result.filter(e => e.in_reserve);
    else if (activeTab === 'positive') result = result.filter(e => e.dynamics_score > 0);
    else if (activeTab === 'negative') result = result.filter(e => e.dynamics_score < 0);

    return result.filter(emp => {
      const matchName = emp.full_name.toLowerCase().includes(nameSearch.toLowerCase());
      const matchPos = selectedPos 
        ? emp.position_name === selectedPos 
        : emp.position_name.toLowerCase().includes(posSearch.toLowerCase());
      
      const matchDept = (user?.role !== 'hr' || !selectedDept) 
        ? emp.department_name.toLowerCase().includes(deptSearch.toLowerCase())
        : emp.department_name === selectedDept;

      return matchName && matchPos && matchDept;
    }).sort((a, b) => b.dynamics_score - a.dynamics_score);
  }, [employees, activeTab, nameSearch, posSearch, deptSearch, selectedPos, selectedDept, user?.role]);

  if (authLoading || loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black text-xs uppercase">Загрузка...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20">
      <button 
        onClick={() => navigate('/dashboard')}
        className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors mb-8"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Назад
      </button>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Кадровый резерв</h1>
            <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Управление талантами</p>
          </div>
        </div>
        
        <div className="flex bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm">
          {(['all', 'reserve', 'positive', 'negative'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSearchParams(prev => { prev.set('tab', tab); return prev; })}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab === 'all' ? 'Все' : tab === 'reserve' ? 'Резерв' : tab === 'positive' ? 'Рост' : 'Риск'}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-10">
        <div className="md:col-span-4 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Поиск сотрудника..."
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[20px] shadow-sm outline-none focus:border-indigo-600 transition-all font-bold text-slate-700"
          />
        </div>

        {['hr', 'director'].includes(user?.role || '') && (
          <div className="md:col-span-3 relative" ref={deptRef}>
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Отдел..."
              autoComplete="off"
              value={showDeptList ? deptSearch : (selectedDept || deptSearch)}
              onFocus={() => { setShowDeptList(true); setDeptSearch(''); }}
              onChange={(e) => { setDeptSearch(e.target.value); setSelectedDept(null); }}
              className="w-full pl-14 pr-12 py-4 bg-white border border-slate-100 rounded-[20px] shadow-sm outline-none focus:border-indigo-600 transition-all font-bold text-slate-700 text-ellipsis"
            />
            <ChevronDown className={`absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showDeptList ? 'rotate-180' : ''}`} size={18} />
            {showDeptList && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2">
                <div onMouseDown={() => { setSelectedDept(null); setDeptSearch(''); setShowDeptList(false); }} className="px-4 py-2 hover:bg-slate-50 rounded-xl cursor-pointer text-[10px] font-black uppercase text-indigo-600">Все отделы</div>
                {uniqueDepts.filter(d => d.toLowerCase().includes(deptSearch.toLowerCase())).map(d => (
                  <div key={d} onMouseDown={() => { setSelectedDept(d); setDeptSearch(d); setShowDeptList(false); }} className="px-4 py-3 hover:bg-indigo-50 rounded-xl cursor-pointer text-xs font-bold text-slate-600">{d}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={`${user?.role === 'hr' ? 'md:col-span-4' : 'md:col-span-7'} relative`} ref={posRef}>
          <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Должность..."
            autoComplete="off"
            value={showPosList ? posSearch : (selectedPos || posSearch)}
            onFocus={() => { setShowPosList(true); setPosSearch(''); }}
            onChange={(e) => { setPosSearch(e.target.value); setSelectedPos(null); }}
            className="w-full pl-14 pr-12 py-4 bg-white border border-slate-100 rounded-[20px] shadow-sm outline-none focus:border-indigo-600 transition-all font-bold text-slate-700 text-ellipsis"
          />
          <ChevronDown className={`absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showPosList ? 'rotate-180' : ''}`} size={18} />
          {showPosList && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2">
              <div onMouseDown={() => { setSelectedPos(null); setPosSearch(''); setShowPosList(false); }} className="px-4 py-2 hover:bg-slate-50 rounded-xl cursor-pointer text-[10px] font-black uppercase text-indigo-600">Все должности</div>
              {uniquePositions.filter(p => p.toLowerCase().includes(posSearch.toLowerCase())).map(p => (
                <div key={p} onMouseDown={() => { setSelectedPos(p); setPosSearch(p); setShowPosList(false); }} className="px-4 py-3 hover:bg-indigo-50 rounded-xl cursor-pointer text-xs font-bold text-slate-600">{p}</div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <button 
            onClick={() => { setNameSearch(''); setSelectedPos(null); setSelectedDept(null); setPosSearch(''); setDeptSearch(''); }}
            className="w-full h-full flex items-center justify-center bg-slate-900 text-white rounded-[20px] hover:bg-rose-600 transition-colors shadow-lg shadow-slate-200"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEmployees.map(emp => {
          const isNeg = emp.dynamics_score < 0;
          const availableRoles = allRoles.filter(r => r.department === null || r.department === emp.department_id);

          return (
            <div key={emp.id} className={`bg-white border rounded-[40px] p-8 transition-all hover:shadow-2xl flex flex-col ${isNeg ? 'border-rose-100 bg-rose-50/20' : 'border-slate-100'}`}>
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">{emp.full_name}</h3>
                <p className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-widest italic">{emp.position_name}</p>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className={`text-4xl font-black ${isNeg ? 'text-rose-500' : 'text-emerald-500'}`}>{emp.dynamics_score}%</div>
                <div className="text-[9px] font-black uppercase text-slate-400 leading-none">Потенциал<br />развития</div>
              </div>

              {emp.reserved_positions.length > 0 && (
                <div className="mb-6 space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">В резерве на:</label>
                  <div className="flex flex-wrap gap-2">
                    {emp.reserved_positions.map(p => (
                      <span key={p.id} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 cursor-default">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto space-y-5 pt-6 border-t border-slate-50">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest ml-1 flex items-center gap-1 text-indigo-600">
                    <CheckCircle2 size={10} /> Целевая роль
                  </label>
                  <select
                    className="w-full px-5 py-4 bg-white border border-indigo-100 rounded-2xl outline-none font-bold text-xs focus:border-indigo-500 transition-all cursor-pointer"
                    value={selectedRoleForEmployee[emp.id] || ''}
                    onChange={(e) => setSelectedRoleForEmployee(prev => ({ ...prev, [emp.id]: Number(e.target.value) }))}
                  >
                    <option value="">Выберите роль для анализа...</option>
                    {availableRoles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                </div>

                <button
                  onClick={() => navigate(`/reserve/match/role/${emp.id}/${selectedRoleForEmployee[emp.id]}`)}
                  disabled={!selectedRoleForEmployee[emp.id]}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-20 transition-all shadow-lg shadow-slate-100"
                >
                  Анализ соответствия
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-16 flex justify-center pb-20">
        <button onClick={() => navigate('/reserve/positions')} className="group flex items-center gap-6 bg-white hover:bg-slate-900 border-2 border-slate-100 hover:border-slate-900 px-10 py-6 rounded-[40px] transition-all shadow-xl">
          <div className="w-14 h-14 bg-indigo-50 group-hover:bg-white/10 rounded-2xl flex items-center justify-center text-3xl transition-all"><Users size={32} /></div>
          <div className="text-left">
            <div className="font-black text-xl text-slate-900 group-hover:text-white transition-colors tracking-tight leading-none">Кандидаты по должностям</div>
            <div className="text-[10px] font-black uppercase text-slate-400 group-hover:text-indigo-300 transition-colors tracking-[0.2em] mt-2">Открыть вакансии резерва</div>
          </div>
        </button>
      </div>
    </div>
  );
}