import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, RefreshCw, CheckCircle2, Users, Target, X } from 'lucide-react';
import axios from 'axios';

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

interface PositionOption {
  id: number;
  name: string;
  department_id: number;
}

export default function Reserve() {
  const { loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const selectedDepartment = searchParams.get('dept') || '';
  const selectedPosition = searchParams.get('pos') || '';
  const activeTab = (searchParams.get('tab') as 'all' | 'reserve' | 'positive' | 'negative') || 'all';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allRoles, setAllRoles] = useState<RoleOption[]>([]);
  const [allPositions, setAllPositions] = useState<PositionOption[]>([]);
  const [rolesByPosition, setRolesByPosition] = useState<Record<number, RoleOption[]>>({});
  const [loading, setLoading] = useState(true);

  const [selectedRoleForEmployee, setSelectedRoleForEmployee] = useState<Record<number, number>>({});
  const [selectedTargetPositionForEmployee, setSelectedTargetPositionForEmployee] = useState<Record<number, number>>({});

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    setSearchParams(params, { replace: true });
  };

  const fetchData = async () => {
    try {
      const [empRes, roleRes, posRes] = await Promise.all([
        api.get<Employee[]>('employees/dynamics/'),
        api.get<RoleOption[]>('roles/'),
        api.get<PositionOption[]>('positions/')
      ]);
      setEmployees(empRes.data || []);
      setAllRoles(roleRes.data || []);
      setAllPositions(posRes.data || []);
    } catch (err) {
      console.error("Ошибка загрузки", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const loadRolesForPosition = async (positionId: number) => {
    if (!positionId || rolesByPosition[positionId]) return;
    try {
      const res = await api.get<RoleOption[]>(`/positions/${positionId}/roles/`);
      setRolesByPosition(prev => ({ ...prev, [positionId]: res.data || [] }));
    } catch (err) {
      console.error('Ошибка ролей', err);
    }
  };

  const toggleReserve = async (emp: Employee, posIdToRemove?: number) => {
    const targetPosId = posIdToRemove || selectedTargetPositionForEmployee[emp.id];
    const targetRoleId = selectedRoleForEmployee[emp.id];

    if (!posIdToRemove && !targetPosId) {
      alert("Выберите целевую должность");
      return;
    }

    try {
      if (posIdToRemove) {
        await api.delete(`employees/${emp.id}/reserve/remove/`, {
          data: { position_id: posIdToRemove }
        });
      } else {
        await api.post(`employees/${emp.id}/reserve/add/`, {
          position_id: targetPosId,
          role_id: targetRoleId || null
        });
        setSelectedTargetPositionForEmployee(prev => ({ ...prev, [emp.id]: 0 }));
        setSelectedRoleForEmployee(prev => ({ ...prev, [emp.id]: 0 }));
      }
      fetchData();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.detail || "Ошибка обновления");
      }
    }
  };

  const allDepartments = useMemo(() =>
    Array.from(new Set(employees.map(e => e.department_name))).filter(Boolean)
  , [employees]);

  const availablePositionsForFilter = useMemo(() => {
    const base = selectedDepartment
      ? employees.filter(e => e.department_name === selectedDepartment)
      : employees;
    return Array.from(new Set(base.map(e => e.position_name))).filter(Boolean);
  }, [employees, selectedDepartment]);

  const filteredEmployees = useMemo(() => {
    let result = [...employees];
    if (activeTab === 'reserve') result = result.filter(e => e.in_reserve);
    else if (activeTab === 'positive') result = result.filter(e => e.dynamics_score > 0);
    else if (activeTab === 'negative') result = result.filter(e => e.dynamics_score < 0);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(e => e.full_name.toLowerCase().includes(term));
    }
    if (selectedDepartment) result = result.filter(e => e.department_name === selectedDepartment);
    if (selectedPosition) result = result.filter(e => e.position_name === selectedPosition);

    return result.sort((a, b) => b.dynamics_score - a.dynamics_score);
  }, [employees, activeTab, searchTerm, selectedDepartment, selectedPosition]);

  if (authLoading || loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black text-xs uppercase">Загрузка...</div>;

  return (
    <div className="max-w-7xl mx-auto p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Кадровый резерв</h1>
            <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Управление талантами</p>
          </div>
        </div>
      </header>

      {/* ФИЛЬТРЫ (ВЕРНУЛИ ПОЗИЦИИ) */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 mb-10 flex flex-wrap gap-4 items-center">
        <div className="flex bg-slate-100 rounded-2xl p-1">
          {(['all', 'reserve', 'positive', 'negative'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => updateFilters({ tab })}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
            >
              {tab === 'all' ? 'Все' : tab === 'reserve' ? 'Резерв' : tab === 'positive' ? 'Рост' : 'Риск'}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Поиск по имени..."
          value={searchTerm}
          onChange={e => updateFilters({ q: e.target.value })}
          className="flex-1 min-w-[200px] border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:border-indigo-600 font-bold text-sm"
        />
        <select
          value={selectedDepartment}
          onChange={e => updateFilters({ dept: e.target.value, pos: null })}
          className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none"
        >
          <option value="">Все отделы</option>
          {allDepartments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        {/* ВЕРНУЛИ ФИЛЬТР ПО ДОЛЖНОСТЯМ */}
        <select
          value={selectedPosition}
          onChange={e => updateFilters({ pos: e.target.value })}
          className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none"
        >
          <option value="">Все должности</option>
          {availablePositionsForFilter.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <button onClick={() => setSearchParams({})} className="p-3 text-slate-400 hover:text-rose-500 transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEmployees.map(emp => {
          const isNeg = emp.dynamics_score < 0;
          const targetPosId = selectedTargetPositionForEmployee[emp.id];
          
          // Логика формирования списка ролей
          let availableRoles: RoleOption[] = [];
          if (targetPosId && rolesByPosition[targetPosId]) {
            availableRoles = rolesByPosition[targetPosId];
          } else {
            // Если должность не выбрана, показываем роли его отдела или общие
            availableRoles = allRoles.filter(r => r.department === null || r.department === emp.department_id);
          }

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
                      <span key={p.id} className="group text-[10px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-emerald-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 transition-all cursor-default">
                        {p.name}
                        <X size={14} className="cursor-pointer hover:scale-125 transition-transform" onClick={() => toggleReserve(emp, p.id)} />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto space-y-5 pt-6 border-t border-slate-50">
                {/* Выбор новой должности */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Target size={10} /> Целевая должность
                  </label>
                  <select
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xs focus:border-indigo-500 transition-all cursor-pointer"
                    value={targetPosId || ''}
                    onChange={(e) => {
                      const pId = Number(e.target.value);
                      setSelectedTargetPositionForEmployee(prev => ({ ...prev, [emp.id]: pId }));
                      
                      if (pId) {
                        loadRolesForPosition(pId);
                        const currentRole = selectedRoleForEmployee[emp.id];
                        if (currentRole && rolesByPosition[pId] && !rolesByPosition[pId].some(r => r.id === currentRole)) {
                            setSelectedRoleForEmployee(prev => ({ ...prev, [emp.id]: 0 }));
                        }
                      }
                    }}
                  >
                    <option value="">Выберите должность...</option>
                    {allPositions
                      .filter(p => p.department_id === emp.department_id)
                      .filter(p => !emp.reserved_positions.some(rp => rp.id === p.id))
                      .map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                    }
                  </select>
                </div>

                {/* Выбор роли */}
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

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/hr/match/role/${emp.id}/${selectedRoleForEmployee[emp.id]}`)}
                    disabled={!selectedRoleForEmployee[emp.id]}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-20 transition-all active:scale-95"
                  >
                    Анализ
                  </button>
                  <button
                    onClick={() => toggleReserve(emp)}
                    disabled={!targetPosId}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
                  >
                    Добавить
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Футер-кнопка */}
      <div className="mt-16 flex justify-center pb-20">
        <button onClick={() => navigate('/hr/reserve/positions')} className="group flex items-center gap-6 bg-white hover:bg-slate-900 border-2 border-slate-100 hover:border-slate-900 px-10 py-6 rounded-[40px] transition-all shadow-xl">
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