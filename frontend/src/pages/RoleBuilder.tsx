import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/axios';
import { Plus, Layers, CheckCircle2, Settings2, X, ArrowUpRight, Search } from 'lucide-react';

interface Competency {
  id: number;
  name: string;
  description: string;
  category: number;
}

interface Position {
  id: number;
  name: string;
  department_id: number;
}

interface PositionProfileItem {
  id: number;
  competency: number;
  competency_name: string;
  required_level: number;
  weight: number;
  is_key: boolean;
}

interface Role {
  id: number;
  name: string;
  description: string;
  department: number | null;
  department_name: string | null;
  positions: number[]; 
}

interface DraftItem {
  competency: number;
  competency_name: string;
  required_level: number;
  weight: number;
  is_key: boolean;
}

interface RoleProfileResponse {
  profiles?: DraftItem[];
  [key: number]: DraftItem;
}

export default function RoleBuilder() {
  const [departments, setDepartments] = useState<{id: number, name: string}[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  const [posProfiles, setPosProfiles] = useState<Record<number, PositionProfileItem[]>>({});

  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState<number | ''>('');
  const [filterPos, setFilterPos] = useState<number | ''>('');

  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState(''); 
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [selectedPosIds, setSelectedPosIds] = useState<number[]>([]);
  const [draft, setDraft] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [d, c, r, p] = await Promise.all([
        api.get<{id: number, name: string}[]>('departments/'),
        api.get<Competency[]>('competencies/'),
        api.get<Role[]>('roles/'),
        api.get<Position[]>('positions/')
      ]);
      setDepartments(d.data);
      setCompetencies(c.data);
      setRoles(r.data);
      setPositions(p.data);
    } catch (err) {
      console.error("Ошибка загрузки справочников", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const loadPosProfile = useCallback(async (posId: number) => {
    if (posProfiles[posId]) return;
    try {
      const res = await api.get<PositionProfileItem[]>(`positions/${posId}/profile/`);
      setPosProfiles(prev => ({ ...prev, [posId]: res.data }));
    } catch (err) {
      console.error(`Ошибка профиля должности ${posId}`, err);
    }
  }, [posProfiles]);

  useEffect(() => {
    selectedPosIds.forEach(id => loadPosProfile(id));
  }, [selectedPosIds, loadPosProfile]);

  const filteredPositionsForSearch = useMemo(() => {
    if (filterDept === '') return positions;
    return positions.filter(p => p.department_id === filterDept);
  }, [positions, filterDept]);

  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = filterDept === '' || role.department === filterDept;
      const matchesPos = filterPos === '' || role.positions.includes(Number(filterPos));
      return matchesSearch && matchesDept && matchesPos;
    });
  }, [roles, searchTerm, filterDept, filterPos]);

  const finalProfile = useMemo(() => {
    const combined: Record<number, { 
      name: string; level: number; weight: number; is_key: boolean; source: 'role' | 'position' | 'merged'
    }> = {};

    draft.forEach(item => {
      combined[item.competency] = {
        name: item.competency_name, level: item.required_level, weight: item.weight, is_key: item.is_key, source: 'role'
      };
    });

    selectedPosIds.forEach(posId => {
      const profiles = posProfiles[posId] || [];
      profiles.forEach(pp => {
        const existing = combined[pp.competency];
        if (existing) {
          const newLevel = Math.max(existing.level, pp.required_level);
          const isHigher = pp.required_level >= existing.level;
          combined[pp.competency] = {
            ...existing,
            level: newLevel,
            weight: Math.max(existing.weight, pp.weight),
            is_key: existing.is_key || pp.is_key,
            source: isHigher ? 'merged' : existing.source
          };
        } else {
          combined[pp.competency] = {
            name: pp.competency_name, level: pp.required_level, weight: pp.weight, is_key: pp.is_key, source: 'position'
          };
        }
      });
    });

    return Object.entries(combined).map(([id, data]) => ({ id: Number(id), ...data }));
  }, [draft, selectedPosIds, posProfiles]);

  const availableCompetencies = useMemo(() => {
    const usedInDraft = new Set(draft.map(d => d.competency));
    const usedInPositions = new Set(selectedPosIds.flatMap(id => (posProfiles[id] || []).map(p => p.competency)));
    return competencies.filter(c => !usedInDraft.has(c.id) && !usedInPositions.has(c.id));
  }, [competencies, draft, selectedPosIds, posProfiles]);

  const visibleDraft = useMemo(() => {
    return draft.filter(item => {
      const maxPosLevel = selectedPosIds.reduce((max, posId) => {
        const found = (posProfiles[posId] || []).find(p => p.competency === item.competency);
        return found ? Math.max(max, found.required_level) : max;
      }, 0);
      return item.required_level > maxPosLevel;
    });
  }, [draft, selectedPosIds, posProfiles]);

  const handleSave = async () => {
    if (!roleName) return alert("Введите название роли");
    setLoading(true);
    try {
      const roleData = {
        name: roleName,
        description: roleDesc,
        department: selectedDeptId || null,
        positions: selectedPosIds 
      };

      let rId = editingRoleId;
      if (editingRoleId) {
        await api.put(`roles/${editingRoleId}/`, roleData);
      } else {
        const res = await api.post<Role>('roles/', roleData);
        rId = res.data.id;
      }

      await api.post(`roles/${rId}/profile/`, draft);
      alert("Роль успешно сохранена");
      setEditingRoleId(null);
      setActiveTab('list');
      fetchData();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as {response: {data?: {detail?: string}}};
        setError(axiosError.response?.data?.detail || 'Неизвестная ошибка');
      } else {
        setError('Неизвестная ошибка')
      }
    } finally {
      setLoading(false);
    }
  };

  const startEdit = async (role: Role) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleDesc(role.description || '');
    setSelectedDeptId(role.department || '');
    setSelectedPosIds(role.positions);

    try {
      const res = await api.get<RoleProfileResponse | DraftItem[]>(`roles/${role.id}/profile/`);
      const rawData = res.data;
      const data = Array.isArray(rawData) ? rawData : (rawData.profiles || []);
      
      setDraft(data.map(i => ({
        competency: i.competency,
        competency_name: i.competency_name,
        required_level: i.required_level,
        weight: i.weight,
        is_key: i.is_key
      })));
    } catch (e) { console.error(e); }
    setActiveTab('editor');
  };

  if (error) return <div className="p-20 text-center text-red-500 font-bold">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Конструктор ролей</h1>
          <p className="text-slate-500 text-sm">Управление компетенциями</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
          <button onClick={() => setActiveTab('list')} className={`px-6 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>Список ролей</button>
          <button onClick={() => { setEditingRoleId(null); setRoleName(''); setRoleDesc(''); setDraft([]); setSelectedPosIds([]); setSelectedDeptId(''); setActiveTab('editor'); }} className={`px-6 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'editor' && !editingRoleId ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>
            {editingRoleId ? 'Редактирование' : 'Создать роль'}
            </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="relative col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Введите название..." className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-5 py-3 text-sm font-bold focus:ring-2 ring-indigo-500" />
            </div>
            <select value={filterDept} onChange={e => { setFilterDept(e.target.value ? Number(e.target.value) : ''); setFilterPos(''); }} className="bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-bold">
              <option value="">Все отделы</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={filterPos} onChange={e => setFilterPos(e.target.value ? Number(e.target.value) : '')} className="bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-bold">
              <option value="">Все должности</option>
              {filteredPositionsForSearch.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map(role => (
              <div key={role.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Layers size={24} /></div>
                    <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{role.department_name || 'Общая'}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{role.name}</h3>
                  <p className="text-slate-400 text-sm mb-6 line-clamp-2">{role.description}</p>
                </div>
                <button onClick={() => startEdit(role)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-colors">Редактировать</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Код редактора (Левая часть) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
              <h2 className="text-lg font-black mb-6 flex items-center gap-2"><Settings2 size={20} className="text-indigo-500"/> Параметры</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="Название" className="bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 ring-indigo-500" />
                <select value={selectedDeptId} onChange={e => { setSelectedDeptId(e.target.value ? Number(e.target.value) : ''); setSelectedPosIds([]); }} className="bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-bold">
                  <option value="">Все отделы</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <textarea value={roleDesc} onChange={e => setRoleDesc(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-bold mb-6 min-h-[100px] resize-none" placeholder="Описание..." />
              <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl">
                {positions.filter(p => !selectedDeptId || p.department_id === selectedDeptId).map(pos => (
                  <button key={pos.id} onClick={() => setSelectedPosIds(prev => prev.includes(pos.id) ? prev.filter(id => id !== pos.id) : [...prev, pos.id])} className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all border ${selectedPosIds.includes(pos.id) ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}>{pos.name}</button>
                ))}
              </div>
            </div>

            {/* Итоговый профиль */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
              <h2 className="text-xl font-black mb-8 text-emerald-400 flex items-center gap-2"><CheckCircle2 size={20}/> Итоговый профиль</h2>
              <div className="space-y-3">
                {finalProfile.map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border ${item.source === 'merged' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-white/5'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.source === 'merged' || item.source === 'position' ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                        {item.source === 'merged' ? <ArrowUpRight size={18}/> : <Layers size={18}/>}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-[9px] font-black uppercase opacity-40">{item.source === 'merged' ? 'Перекрыто должностью' : item.source === 'position' ? 'Из должности' : 'Из роли'}</p>
                      </div>
                    </div>
                    <div className="flex gap-8">
                       <div className="text-right"><p className="text-[8px] text-slate-500 uppercase font-black">Уровень</p><p className="text-lg font-black">{item.level}%</p></div>
                       <div className="text-right"><p className="text-[8px] text-slate-500 uppercase font-black">Вес</p><p className="text-lg font-black">{item.weight}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Правая часть (Стандарты роли) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm sticky top-6">
              <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 text-indigo-600"><Plus size={20}/> Настройка компетенций</h3>
              <div className="space-y-3 mb-6 max-h-[350px] overflow-y-auto pr-2">
                {visibleDraft.map((item) => (
                  <div key={item.competency} className="bg-slate-50 p-4 rounded-xl relative border border-transparent hover:border-indigo-100 transition-all">
                    <button onClick={() => setDraft(draft.filter(d => d.competency !== item.competency))} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500"><X size={16}/></button>
                    <p className="text-[13px] font-bold text-slate-800 mb-3">{item.competency_name}</p>
                    <div className="flex gap-3">
                      <input type="number" value={item.required_level} onChange={e => setDraft(draft.map(d => d.competency === item.competency ? {...d, required_level: Number(e.target.value)} : d))} className="w-20 bg-white border border-slate-200 rounded-lg py-1 text-center font-black text-xs text-slate-600" />
                      <input type="number" step="0.05" value={item.weight} onChange={e => setDraft(draft.map(d => d.competency === item.competency ? {...d, weight: Number(e.target.value)} : d))} className="w-20 bg-white border border-slate-200 rounded-lg py-1 text-center font-black text-xs text-slate-600" />
                      <button onClick={() => setDraft(draft.map(d => d.competency === item.competency ? {...d, is_key: !d.is_key} : d))} className={`px-2 rounded-lg text-[10px] font-black ${item.is_key ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-400'}`}>Ключевая</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-50 pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-3 ml-2 tracking-widest">Доступные компетенции</p>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {availableCompetencies.map(c => (
                    <button key={c.id} onClick={() => setDraft([...draft, {competency: c.id, competency_name: c.name, required_level: 60, weight: 0.1, is_key: false}])} className="w-full text-left p-3 rounded-lg hover:bg-indigo-50 text-[12px] font-bold text-slate-600 flex justify-between group transition-colors">
                      {c.name} <Plus size={14} className="opacity-0 group-hover:opacity-100 text-indigo-600" />
                    </button>
                  ))}
                </div>
              </div>

              <button 
              onClick={handleSave} 
              disabled={loading} 
              className="w-full mt-6 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                {loading ? 'Обработка...' : (editingRoleId ? 'Сохранить изменения' : 'Создать роль')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}