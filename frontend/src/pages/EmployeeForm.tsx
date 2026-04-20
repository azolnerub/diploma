import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Lock, Briefcase, Calendar as CalendarIcon, ChevronRight, Save, X, AlertCircle, Loader2, CheckCircle2, Shield } from 'lucide-react';
import api from '../api/axios';
import axios from 'axios';

interface Position { id: number; name: string; department_id: number; }
interface Department { id: number; name: string; }

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

export default function EmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const deptRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<HTMLDivElement>(null);

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

  const [dictionaries, setDictionaries] = useState({ depts: [] as Department[], positions: [] as Position[] });
  const [names, setNames] = useState({ dept: '', pos: '' });
  const [search, setSearch] = useState({ dept: '', pos: '' });
  const [showList, setShowList] = useState({ dept: false, pos: false });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // --- ЛОГИКА ЗАКРЫТИЯ СПИСКОВ ПРИ КЛИКЕ ВНЕ ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) {
        setShowList(prev => ({ ...prev, dept: false }));
      }
      if (posRef.current && !posRef.current.contains(event.target as Node)) {
        setShowList(prev => ({ ...prev, pos: false }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- ЗАГРУЗКА ДАННЫХ ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [d, p] = await Promise.all([
          api.get<Department[]>('departments/'),
          api.get<Position[]>('positions/')
        ]);
        setDictionaries({ depts: d.data, positions: p.data });

        if (isEdit && id) {
          const res = await api.get(`employees/${id}/`);
          const data = res.data;
          
          const roleMap: Record<string, string> = {
            'Сотрудник': 'employee', 'Руководитель': 'manager', 'HR-специалист': 'hr',
            'employee': 'employee', 'manager': 'manager', 'hr': 'hr'
          };

          setForm({
            full_name: data.full_name || '',
            username: data.username || '',
            system_role: roleMap[data.role] || data.role || 'employee',
            department_id: data.department_id || '',
            position_id: data.position_id || '',
            hire_date: data.hire_date ? data.hire_date.split('T')[0] : '',
            status: data.status || 'Работает',
            password: '', 
          });
          setNames({ dept: data.department_name || '', pos: data.position_name || '' });
        }
      } catch {
        setError('Не удалось загрузить данные');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, isEdit]);

  const filteredPositions = useMemo(() => {
    return dictionaries.positions.filter(p => !form.department_id || p.department_id === Number(form.department_id));
  }, [dictionaries.positions, form.department_id]);

  // --- СОХРАНЕНИЕ ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.department_id || !form.position_id) {
      setError('Выберите отдел и должность из списка');
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const formCopy = { ...form };
      const payload = formCopy as Record<string, unknown>;

      if (isEdit) {
        delete payload.username;
        delete payload.hire_date;
        delete payload.password;
        await api.put(`employees/${id}/update/`, payload);
      } else {
        await api.post('employees/create/', payload);
      }

      setSuccess(true);
      setTimeout(() => navigate('/employees'), 1500);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Ошибка при сохранении');
      } else {
        setError('Произошла непредвиденная ошибка');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
      <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Загрузка данных...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
            <Shield size={14} />
            <span>Кадровый реестр</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {isEdit ? 'Редактирование' : 'Новый сотрудник'}
          </h1>
        </div>
        <button type="button" onClick={() => navigate(-1)} className="p-3 rounded-2xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all">
          <X size={20} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        <div className="lg:col-span-2 space-y-8">
          {/* КАРТОЧКА: ЛИЧНЫЕ ДАННЫЕ */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-8">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><User size={20} /></div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Личная информация</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ФИО</label>
                <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300" placeholder="Иванов Иван Иванович" required />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Логин</label>
                <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} disabled={isEdit} className={`w-full px-6 py-4 border rounded-2xl font-bold transition-all outline-none ${isEdit ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-600 text-slate-700'}`} required />
              </div>

              {!isEdit && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold" placeholder="Минимум 6 символов" required />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* КАРТОЧКА: ОРГСТРУКТУРА */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-8">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Briefcase size={20} /></div>
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Должность и отдел</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative" ref={deptRef}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Отдел</label>
                <input 
                  type="text" 
                  autoComplete="off"
                  value={showList.dept ? search.dept : names.dept}
                  onFocus={() => { setShowList({ pos: false, dept: true }); setSearch(prev => ({ ...prev, dept: '' })); }}
                  onChange={e => setSearch({...search, dept: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-slate-700"
                  placeholder="Найти отдел..."
                />
                {showList.dept && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                    {dictionaries.depts.filter(d => d.name.toLowerCase().includes(search.dept.toLowerCase())).map(d => (
                      <div key={d.id} onMouseDown={(e) => { e.preventDefault(); setForm({...form, department_id: d.id, position_id: ''}); setNames({dept: d.name, pos: ''}); setShowList(prev => ({ ...prev, dept: false })); }} className="px-6 py-4 hover:bg-indigo-50 cursor-pointer text-sm font-bold text-slate-600 transition-colors flex justify-between items-center">
                        {d.name} <ChevronRight size={14} className="text-slate-300" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 relative" ref={posRef}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Должность</label>
                <input 
                  type="text" 
                  autoComplete="off"
                  value={showList.pos ? search.pos : names.pos}
                  onFocus={() => { setShowList({ dept: false, pos: true }); setSearch(prev => ({ ...prev, pos: '' })); }}
                  onChange={e => setSearch({...search, pos: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold text-slate-700"
                  placeholder="Выбрать должность..."
                />
                {showList.pos && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                    {filteredPositions.filter(p => p.name.toLowerCase().includes(search.pos.toLowerCase())).map(p => (
                      <div key={p.id} onMouseDown={(e) => { e.preventDefault(); setForm({...form, position_id: p.id}); setNames({...names, pos: p.name}); setShowList(prev => ({ ...prev, pos: false })); }} className="px-6 py-4 hover:bg-indigo-50 cursor-pointer text-sm font-bold text-slate-600 transition-colors">
                        {p.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ: СИСТЕМНЫЕ НАСТРОЙКИ */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[32px] p-8 text-white space-y-6 shadow-xl shadow-slate-200/50">
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-500 border-b border-white/5 pb-4">Конфигурация доступа</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Роль сотрудника</label>
                <select value={form.system_role} onChange={e => setForm({...form, system_role: e.target.value})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm appearance-none cursor-pointer">
                  <option value="employee" className="text-slate-900">Сотрудник</option>
                  <option value="hr" className="text-slate-900">HR-специалист</option>
                  <option value="manager" className="text-slate-900">Руководитель</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Дата приема</label>
                <div className="relative">
                  <CalendarIcon className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" size={16} />
                  <input 
                    type="date" 
                    value={form.hire_date} 
                    onChange={e => setForm({...form, hire_date: e.target.value})} 
                    disabled={isEdit}
                    onClick={(e) => !isEdit && e.currentTarget.showPicker()}
                    className={`w-full px-5 py-4 border rounded-2xl outline-none font-bold text-sm transition-all [color-scheme:dark] ${isEdit ? 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white focus:border-indigo-500 cursor-pointer'}`}
                  />
                </div>
                {isEdit && <p className="text-[9px] text-slate-600 ml-1 italic font-bold">Дата не подлежит изменению</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Статус в системе</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm appearance-none cursor-pointer">
                  <option value="Работает" className="text-slate-900">Работает</option>
                  <option value="В отпуске" className="text-slate-900">В отпуске</option>
                  <option value="Уволен" className="text-slate-900">Уволен</option>
                </select>
              </div>
            </div>

            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-[10px] font-black uppercase tracking-wider text-center flex items-center gap-2"><AlertCircle size={14}/> {error}</div>}
            {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-2 animate-in fade-in zoom-in"><CheckCircle2 size={14}/> Сохранено успешно</div>}

            <button type="submit" disabled={isSaving} className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isSaving ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 active:scale-95'}`}>
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> {isEdit ? 'Обновить профиль' : 'Создать сотрудника'}</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
