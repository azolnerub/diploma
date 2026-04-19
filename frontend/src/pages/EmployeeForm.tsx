import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate, useParams } from 'react-router-dom';

interface Department { id: number; name: string }
interface Position { 
  id: number; 
  name: string;
  department_id?: number; 
}

interface EmployeeFormState {
  full_name: string;
  username: string;
  password?: string;
  position_id: string | number;
  department_id: string | number;
  system_role: string;
  hire_date: string;
  status: string;
}

interface EmployeePayload {
  full_name: string;
  username: string;
  position_id: number | null;
  department_id: number | null;
  system_role: string;
  hire_date: string;
  status: string;
  password?: string;
}


export default function EmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState<EmployeeFormState>({
    full_name: '',
    username: '',
    password: '',
    position_id: '',
    department_id: '',
    system_role: 'employee',
    hire_date: new Date().toISOString().split('T')[0],
    status: 'Работает',
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  const [deptSearch, setDeptSearch] = useState('');
  const [posSearch, setPosSearch] = useState('');

  const [showDeptList, setShowDeptList] = useState(false);
  const [showPosList, setShowPosList] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptRes, posRes] = await Promise.all([
          api.get('departments/'),
          api.get('positions/'),
        ]);

        setDepartments(deptRes.data || []);
        setPositions(posRes.data || []);

        if (isEdit && id) {
          const empRes = await api.get(`employees/${id}/`);
          const data = empRes.data;

          const roleMap: Record<string, string> = {
            'Сотрудник': 'employee',
            'Руководитель': 'manager',
            'HR-специалист': 'hr',
            'employee': 'employee',
            'manager': 'manager',
            'hr': 'hr'
          };

          const serverRole = data.role || data.user?.role || 'employee';

          setForm(prev => ({
            ...prev,
            full_name: data.full_name || '',
            username: data.username || '',
            system_role: roleMap[serverRole] || 'employee',
            password: '',
            position_id: data.position_id || '',
            department_id: data.department_id || '',
            hire_date: data.hire_date || new Date().toISOString().split('T')[0],
            status: data.status || 'Работает',
          }));

          setDeptSearch(data.department_name || '');
          setPosSearch(data.position_name || '');
        }
      } catch {
        setError('Не удалось загрузить данные');
      }
    };
    loadData();
  }, [id, isEdit]);

  const filteredPositions = positions.filter(p => {
    if (!form.department_id) return true;
    return p.department_id === Number(form.department_id);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validRoles = ['employee', 'hr', 'manager']

    const cleanRole = validRoles.includes(form.system_role)
      ? form.system_role
      : 'employee';

    try {
      const payload: EmployeePayload = {
        full_name: form.full_name,
        username: form.username,
        position_id: form.position_id ? Number(form.position_id) : null,
        department_id: form.department_id ? Number(form.department_id) : null,
        system_role: cleanRole,
        hire_date: form.hire_date,
        status: form.status,
      };

      if (!isEdit && form.password) {
        payload.password = form.password;
      }

      if (isEdit) {
        await api.put(`employees/${id}/update/`, payload);
      } else {
        await api.post('employees/create/', payload);
      }

      setSuccess(true);
      setTimeout(() => navigate('/employees'), 1500);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response: { data?: { detail?: string } } };
        setError(axiosError.response.data?.detail || 'Ошибка при сохранении');
      } else {
         setError('Непредвиденная ошибка');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg mb-10">
      <h2 className="text-3xl font-bold mb-8 text-slate-800">
        {isEdit ? 'Редактирование сотрудника' : 'Добавление сотрудника'}
      </h2>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-6 mb-8 rounded-2xl">
          Данные успешно сохранены!
        </div>
      )}

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 mb-6 rounded-xl">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ФИО сотрудника</label>
            <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Логин</label>
            <input type="text" value={form.username} disabled={isEdit} onChange={e => setForm({...form, username: e.target.value})} className={`w-full border border-slate-300 rounded-lg px-4 py-3 outline-none ${isEdit ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500'}`} required />
          </div>
        </div>

        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Временный пароль</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500" required />
          </div>
        )}

        {/* Новое поле — Системная роль */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Системная роль</label>
          <select 
            value={form.system_role} 
            onChange={e => setForm({...form, system_role: e.target.value})}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 bg-white"
            disabled={isEdit}
          >
            <option value="employee">Сотрудник</option>
            <option value="hr">HR-специалист</option>
            <option value="manager">Руководитель</option>
          </select>
          {isEdit && <p className="text-xs text-slate-500 mt-1">Роль пользователя лучше менять через административную панель</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Отдел</label>
            <input
              type="text"
              placeholder="Поиск отдела..."
              value={deptSearch}
              onChange={e => { setDeptSearch(e.target.value); setForm({...form, department_id: ''}); setShowDeptList(true); }}
              onFocus={() => setShowDeptList(true)}
              onBlur={() => setTimeout(() => setShowDeptList(false), 200)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            {showDeptList && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {departments.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase())).map(d => (
                  <div key={d.id} onClick={() => { setForm({...form, department_id: d.id}); setDeptSearch(d.name); setShowDeptList(false); }} className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm">{d.name}</div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Должность</label>
            <input
              type="text"
              placeholder="Поиск должности..."
              value={posSearch}
              onChange={e => { setPosSearch(e.target.value); setForm({...form, position_id: ''}); setShowPosList(true); }}
              onFocus={() => setShowPosList(true)}
              onBlur={() => setTimeout(() => setShowPosList(false), 200)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            {showPosList && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {filteredPositions.filter(p => p.name.toLowerCase().includes(posSearch.toLowerCase())).map(p => (
                  <div key={p.id} onClick={() => { setForm({...form, position_id: p.id}); setPosSearch(p.name); setShowPosList(false); }} className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm">{p.name}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Дата приёма</label>
            <input type="date" value={form.hire_date} disabled={isEdit} onChange={e => setForm({...form, hire_date: e.target.value})} className={`w-full border border-slate-300 rounded-lg px-4 py-3 outline-none ${isEdit ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500'}`} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
              <option value="Работает">Работает</option>
              <option value="В отпуске">В отпуске</option>
              <option value="Уволен">Уволен</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-100 disabled:opacity-60 active:scale-[0.98]">
          {loading ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Создать сотрудника'}
        </button>
      </form>
    </div>
  );
}
