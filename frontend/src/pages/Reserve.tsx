import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface Employee {
  id: number;
  full_name: string;
  position_name: string;
  department_name: string;
  department_id: number;
  dynamics_score: number;
  in_reserve: boolean;
  status: string;
  position_id?: number;
}

interface RoleOption {
  id: number;
  name: string;
  department?: number | null;
  positions?: number[];
}

export default function Reserve() {
  const {loading: authloading} = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'all' | 'reserve' | 'positive' | 'negative'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [sortBy, setSortBy] = useState<'dynamics' | 'name'>('dynamics');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [selectedRoleForEmployee, setSelectedRoleForEmployee] = useState<Record<number, number>>({});
  const [selectedTargetPositionForEmployee, setSelectedTargetPositionForEmployee] = useState<Record<number, number>>({});
  
  useEffect(() => {
    Promise.all([
      api.get<Employee[]>('employees/dynamics/'),
      api.get<RoleOption[]>('roles/')
    ])
    .then(([empRes, roleRes]) => {
      setEmployees(empRes.data || []);
      setRoles(roleRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const availablePositions = useMemo(() => {
    if (!selectedDepartment) {
      return Array.from(new Set(employees.map(e => e.position_name))).filter(Boolean);
    }
    return Array.from(new Set(employees.filter(e => e.department_name === selectedDepartment).map(e => e.position_name))).filter(Boolean);
  }, [employees, selectedDepartment]);

const availableRoles = useMemo(() => {
  let filtered = [...roles];

  if (selectedDepartment) {
    const employeeInDept = employees.find(e => e.department_name === selectedDepartment);
    const deptId = employeeInDept?.department_id; 

    if (deptId !== undefined && deptId !== null) {
      filtered = filtered.filter(role => {
        return role.department === null || Number(role.department) === Number(deptId);
      });
    }
  }

  if (selectedPosition) {
    const posId = employees.find(e => 
      e.position_name === selectedPosition && 
      (!selectedDepartment || e.department_name === selectedDepartment)
    )?.position_id;

    if (posId) {
      filtered = filtered.filter(role => 
        Array.isArray(role.positions) && role.positions.map(Number).includes(Number(posId))
      );
    }
  }

  return filtered;
}, [roles, selectedDepartment, employees, selectedPosition]);

  const filteredEmployees = useMemo(() => {
    let result = [...employees];

    if (activeTab === 'reserve') result = result.filter(e => e.in_reserve);
    else if (activeTab === 'positive') result = result.filter(e => e.dynamics_score > 0);
    else if (activeTab === 'negative') result = result.filter(e => e.dynamics_score < 0);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(e => e.full_name.toLowerCase().includes(term));
    }

    if (selectedDepartment) {result = result.filter(e => e.department_name === selectedDepartment);}

    if (selectedPosition) {result = result.filter(e => e.position_name === selectedPosition);}

    result.sort((a, b) => {
      if (sortBy === 'dynamics') {
        return sortOrder === 'desc'
          ? (b.dynamics_score || 0) - (a.dynamics_score || 0)
          : (a.dynamics_score || 0) - (b.dynamics_score || 0);
      }
      return sortOrder === 'desc'
        ? a.full_name.localeCompare(b.full_name)
        : b.full_name.localeCompare(a.full_name);
    });
    return result;
  }, [employees, activeTab, searchTerm, selectedDepartment, selectedPosition, sortBy, sortOrder,]);

  if (authloading) return <div className="p-10 text-center">Загрузка пользователя...</div>;

  const allDepartments = Array.from(new Set(employees.map(e => e.department_name))).filter(Boolean);

  const handleAnalyzeRole = (employeeId: number) => {
    const roleId = selectedRoleForEmployee[employeeId];
    if (!roleId) return alert('Выберите целевую роль для анализа');
    navigate(`/hr/match/role/${employeeId}/${roleId}`);
  };

const toggleReserve = async (employeeId: number) => {
  const employee = employees.find(e => e.id === employeeId);
  if (!employee) return;

  const isCurrentlyInReserve = employee.in_reserve;
  const targetPositionId = selectedTargetPositionForEmployee[employeeId];

  try {
    if (isCurrentlyInReserve) {
      await api.delete(`employees/${employeeId}/reserve/remove/`);
    } else {
      if (!targetPositionId) {
        alert("Пожалуйста, выберите целевую должность перед добавлением в резерв");
        return;
      }
      await api.post(`employees/${employeeId}/reserve/add/`, {
        position_id: targetPositionId
      });
    }

    const res = await api.get<Employee[]>('employees/dynamics/');
    setEmployees(res.data || []);

    setSelectedTargetPositionForEmployee(prev => {
      const newState = { ...prev };
      delete newState[employeeId];
      return newState;
    });

  } catch (err: unknown) {
    console.error(err);
    if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response: { data?: { detail?: string } } };
        alert(axiosError.response.data?.detail || "Ошибка при работе с резервом");
    } else {
        alert("Непредвиденная ошибка");
    }
  }
};

  const getPotentialLabel = (score: number) => {
    if (score >= 8) return {label: "Высокий потенциал", color: "bg-emerald-100 text-emerald-700"};
    if (score >= 3) return {label: "Средний потенциал", color: "bg-amber-100 text-amber-700"};
    return {label: "Низкий потенциал", color: "bg-slate-100 text-slate-700"};
  };

  const getNegativeReason = (score: number) => {
    if (score <= -5) return "Высокий риск выгорания!";
    if (score <= -2) return "Снижение мотивации!";
    return "Требует внимания!";
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[400px]">
      <div className="animate-spin h-12 w-12 border-b-2 border-indigo-600 rounded-full"></div>
      </div>;
  }

return (
    <div className="max-w-7xl mx-auto p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">Кадровый резерв</h1>
          <p className="text-slate-500 mt-1">Автоматический отбор сотрудников с высоким потенциалом</p>
        </div>

        <div className="flex gap-10 mt-6 md:mt-0">
          <div className="text-center">
            <div className="text-4xl font-semibold text-slate-800">{employees.length}</div>
            <div className="text-xs font-medium uppercase tracking-widest text-slate-500">Всего сотрудников</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-semibold text-emerald-600">{employees.filter(e => e.in_reserve).length}</div>
            <div className="text-xs font-medium uppercase tracking-widest text-slate-500">В резерве</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-semibold text-indigo-600">
              {employees.length > 0 
                ? (employees.reduce((sum, e) => sum + (e.dynamics_score || 0), 0) / employees.length).toFixed(1) 
                : '0'}
            </div>
            <div className="text-xs font-medium uppercase tracking-widest text-slate-500">Средняя динамика</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-10 flex flex-wrap gap-4 items-center">
        <div className="inline-flex bg-slate-100 rounded-2xl p-1">
          {(['all', 'reserve', 'positive', 'negative'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {tab === 'all' && 'Все'}
              {tab === 'reserve' && 'В резерве'}
              {tab === 'positive' && '↑ Положительная'}
              {tab === 'negative' && '↓ Отрицательная'}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Поиск по ФИО..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[280px] border border-slate-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"/>

        <select
          value={selectedDepartment}
          onChange={e => {
            setSelectedDepartment(e.target.value);
            setSelectedPosition('');
            setSelectedRoleForEmployee({});
          }}
          className="border border-slate-200 rounded-2xl px-7 py-3 focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">Все отделы</option>
          {allDepartments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={selectedPosition}
          onChange={e => setSelectedPosition(e.target.value)}
          className="border border-slate-200 rounded-2xl px-7 py-3 focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">Все должности</option>
          {availablePositions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <button
          onClick={() => {
            setSearchTerm('');
            setSelectedDepartment('');
            setSelectedPosition('');
            setSelectedRoleForEmployee({});
          }}
          className="px-6 py-3 text-slate-500 hover:text-slate-700 font-medium transition">Сбросить
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map(emp => {
          const potential = getPotentialLabel(emp.dynamics_score);
          const isNegative = emp.dynamics_score < 0;
          const negativeReason = isNegative ? getNegativeReason(emp.dynamics_score) : '';

          return (
            <div 
              key={emp.id} 
              className={`bg-white border rounded-3xl p-7 hover:shadow transition-all group ${
                isNegative ? 'border-rose-200 hover:border-rose-300 bg-rose-50/30' : 'border-slate-100 hover:border-indigo-200'
              }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-xl text-slate-900">{emp.full_name}</h3>
                  <p className="text-slate-500 mt-1 text-sm">{emp.position_name} • {emp.department_name}</p>
                </div>

                {/* Динамика + Потенциал */}
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-4 py-1.5 text-xs font-semibold rounded-2xl flex items-center gap-1 ${potential.color}`}>
                    {potential.label}
                  </div>

                  {isNegative && (
                    <div className="px-3 py-1 text-xs font-bold bg-rose-100 text-rose-700 rounded-full">{negativeReason}</div>
                  )}
                </div>
              </div>

              {/* Динамика развития */}
              <div className="mt-6 flex items-center gap-3">
                <div className={`text-4xl font-bold ${isNegative ? 'text-rose-600' : emp.dynamics_score > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {emp.dynamics_score > 0 ? '+' : ''}{emp.dynamics_score}%
                </div>
                <div className="text-xs text-slate-500 leading-tight">Динамика<br/>развития</div>
              </div>

              {/* Целевая роль */}
              <div className="mt-8">
                <label className="text-xs font-medium text-slate-500 block mb-2">Целевая роль</label>
                <select
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  value={selectedRoleForEmployee[emp.id] || ''}
                  onChange={(e) => setSelectedRoleForEmployee(prev => ({
                    ...prev,
                    [emp.id]: Number(e.target.value)
                  }))}
                >
                  <option value="">Выберите роль...</option>
                  {availableRoles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              {!emp.in_reserve && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <label className="text-xs font-medium text-slate-500 block mb-2">Целевая должность в резерве</label>
                <select
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  value={selectedTargetPositionForEmployee[emp.id] || ''}
                  onChange={(e) => setSelectedTargetPositionForEmployee(prev => ({
                    ...prev,
                    [emp.id]: Number(e.target.value) || 0
                  }))}
                >
                  <option value="">Выберите должность...</option>
                  {availablePositions.map(p => {
                    const posId = employees.find(e => e.position_name === p)?.position_id;
                    return <option key={p} value={posId}>{p}</option>;
                  })}
                </select>
              </div>
              )}

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => handleAnalyzeRole(emp.id)}
                  disabled={!selectedRoleForEmployee[emp.id]}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-3.5 rounded-2xl transition text-sm">Анализировать роль
                </button>

                <button
                  onClick={() => toggleReserve(emp.id)}
                  className={`flex-1 py-3.5 rounded-2xl font-semibold text-sm transition-all ${
                    emp.in_reserve 
                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}>
                  {emp.in_reserve ? 'Убрать из резерва' : 'Добавить в резерв'}
                </button>
              </div>

              {/* Статус резерва */}
              {emp.in_reserve && (
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-4 py-1 rounded-full">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    В кадровом резерве</span>
                </div>
              )}
            </div>
          );
        })}
        </div>

        <div className="mt-8 flex justify-center">
          <button
          onClick={() => navigate('/hr/reserve/positions')}
          className="group flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-200 px-8 py-4 rounded-3xl transition-all shadow-sm hover:shadow-md">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">👥</div>
            <div className="text-left">
              <div className="font-semibold text-lg text-slate-900">Просмотреть кандидатов по должностям</div>
              <div className="text-sm text-slate-500">Список всех открытых вакансий в резерве</div>
            </div>
            <div className="ml-auto text-3xl text-slate-300 group-hover:text-indigo-400 transition-colors">→</div>
          </button>
        </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-slate-400 font-medium text-lg">По вашему запросу ничего не найдено</p>
        </div>
      )}
    </div>
  );
}
