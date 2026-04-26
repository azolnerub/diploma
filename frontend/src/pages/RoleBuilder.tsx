import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../api/axios';
import { Plus, Layers, CheckCircle2, Settings2, X, ArrowUpRight, Search, ChevronDown, Filter, Briefcase, Tag, RotateCcw } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

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
 
  // Данные с сервера
  const [departments, setDepartments] = useState<{id: number, name: string}[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // Состояние для категорий
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [posProfiles, setPosProfiles] = useState<Record<number, PositionProfileItem[]>>({});

  // Состояния интерфейса
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ФИЛЬТРЫ СПИСКА РОЛЕЙ
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState<number | null>(null);
  const [filterPos, setFilterPos] = useState<number | null>(null);
  const [deptSearch, setDeptSearch] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [showDeptList, setShowDeptList] = useState(false);
  const [showPosList, setShowPosList] = useState(false);

  // ПАРАМЕТРЫ РЕДАКТОРА
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState(''); 
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [editorDeptSearch, setEditorDeptSearch] = useState('');
  const [showEditorDeptList, setShowEditorDeptList] = useState(false);
  const [selectedPos, setSelectedPos] = useState<number[]>([]);
  const [draft, setDraft] = useState<DraftItem[]>([]);

  // ФИЛЬТР КАТЕГОРИЙ (В ПРАВОЙ ПАНЕЛИ)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryList, setShowCategoryList] = useState(false);

  // Рефы для кликов вне элементов
  const deptRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<HTMLDivElement>(null);
  const editDeptRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'editor' && !editingRoleId) {
        setSelectedPos([]); 
    }
  }, [activeTab, selectedDept, editingRoleId]);

  useEffect(() => {
    setFilterPos(null);
    setPosSearch('');
  }, [filterDept]);

  const fetchData = async () => {
    try {
      const [d, c, r, p, cats] = await Promise.all([
        api.get<{id: number, name: string}[]>('departments/'),
        api.get<Competency[]>('competencies/'),
        api.get<Role[]>('roles/'),
        api.get<Position[]>('positions/'),
        api.get<Category[]>('categories/')
      ]);
      setDepartments(d.data);
      setCompetencies(c.data);
      setRoles(r.data);
      setPositions(p.data);
      setCategories(cats.data);
    } catch (err) {
      console.error("Ошибка загрузки данных", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) setShowDeptList(false);
      if (posRef.current && !posRef.current.contains(event.target as Node)) setShowPosList(false);
      if (editDeptRef.current && !editDeptRef.current.contains(event.target as Node)) setShowEditorDeptList(false);
      if (catRef.current && !catRef.current.contains(event.target as Node)) setShowCategoryList(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    selectedPos.forEach(id => loadPosProfile(id));
  }, [selectedPos, loadPosProfile]);

  const filteredPositionsForSearch = useMemo(() => {
    if (filterDept === null) return positions;
    return positions.filter(p => p.department_id === filterDept);
  }, [positions, filterDept]);

  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = filterDept === null || role.department === filterDept;
      const matchesPos = filterPos === null || role.positions.includes(Number(filterPos));
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

    selectedPos.forEach(posId => {
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
  }, [draft, selectedPos, posProfiles]);

  const availableCompetencies = useMemo(() => {
    const usedInDraft = new Set(draft.map(d => d.competency));
    const usedInPositions = new Set(selectedPos.flatMap(id => (posProfiles[id] || []).map(p => p.competency)));
    
    return competencies.filter(c => {
      const notUsed = !usedInDraft.has(c.id) && !usedInPositions.has(c.id);
      const matchesCategory = selectedCategory === null || c.category === selectedCategory;
      return notUsed && matchesCategory;
    });
  }, [competencies, draft, selectedPos, posProfiles, selectedCategory]);

  const visibleDraft = useMemo(() => {
    return draft.filter(item => {
      const maxPosLevel = selectedPos.reduce((max, posId) => {
        const found = (posProfiles[posId] || []).find(p => p.competency === item.competency);
        return found ? Math.max(max, found.required_level) : max;
      }, 0);
      return item.required_level > maxPosLevel;
    });
  }, [draft, selectedPos, posProfiles]);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterDept(null);
    setFilterPos(null);
    setDeptSearch('');
    setPosSearch('');
  };

  const handleSave = async () => {
    if (!roleName) return alert("Введите название роли");
    setLoading(true);
    try {
      const roleData = {
        name: roleName,
        description: roleDesc,
        department: selectedDept,
        positions: selectedPos 
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
        const axiosError = err as { response: { data?: { detail?: string } } };
        setError(axiosError.response?.data?.detail || 'Ошибка сохранения');
      } else {
        setError('Ошибка сохранения');
      }

    } finally {
      setLoading(false);
    }
  };

  const startEdit = async (role: Role) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleDesc(role.description || '');
    setSelectedDept(role.department);
    setSelectedPos(role.positions);

    try {
      const res = await api.get<RoleProfileResponse | DraftItem[]>(`roles/${role.id}/profile/`);
      const data = Array.isArray(res.data) ? res.data : (res.data.profiles || []);
      setDraft(data);
    } catch (e) { console.error(e); }
    setActiveTab('editor');
  };

  if (error) return <div className="p-20 text-center text-red-500 font-bold">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">

      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Конструктор ролей</h1>
          <p className="text-slate-500 text-sm font-medium">Создание эталонных профилей компетенций</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
          <button onClick={() => setActiveTab('list')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400'}`}>Список ролей</button>
          <button onClick={() => { setEditingRoleId(null); setRoleName(''); setRoleDesc(''); setDraft([]); setSelectedPos([]); setSelectedDept(null); setActiveTab('editor'); }} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition ${activeTab === 'editor' && !editingRoleId ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400'}`}>
            {editingRoleId ? 'Редактирование' : 'Создать роль'}
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-6">
          {/* Фильтры списка */}
          <div className="flex gap-4 items-center bg-white p-3 rounded-[2.2rem] border border-slate-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Поиск по названию..." 
                className="w-full bg-slate-50/50 border-none rounded-2xl pl-14 pr-5 py-4 text-sm font-bold focus:ring-2 ring-indigo-500/20" 
              />
            </div>

            <div className="relative w-64" ref={deptRef}>
              <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Отдел..."
                value={showDeptList ? deptSearch : (departments.find(d => d.id === filterDept)?.name || '')}
                onFocus={() => { setShowDeptList(true); setDeptSearch(''); }}
                onChange={(e) => { setDeptSearch(e.target.value); setFilterDept(null); }}
                className="w-full pl-12 pr-10 py-4 bg-slate-50/50 border-none rounded-2xl text-sm font-bold cursor-pointer"
              />
              <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showDeptList ? 'rotate-180' : ''}`} />
              {showDeptList && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2">
                  {departments.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase())).map(dept => (
                    <div key={dept.id} onMouseDown={() => { setFilterDept(dept.id); setDeptSearch(dept.name); setShowDeptList(false); }} className="px-4 py-3 hover:bg-indigo-50 rounded-xl cursor-pointer text-sm font-bold text-slate-600">
                      {dept.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative w-64" ref={posRef}>
              <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Должность..."
                value={showPosList ? posSearch : (positions.find(p => p.id === filterPos)?.name || '')}
                onFocus={() => { setShowPosList(true); setPosSearch(''); }}
                onChange={(e) => { setPosSearch(e.target.value); setFilterPos(null); }}
                className="w-full pl-12 pr-10 py-4 bg-slate-50/50 border-none rounded-2xl text-sm font-bold cursor-pointer"
              />
              <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showPosList ? 'rotate-180' : ''}`} />
              {showPosList && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2">
                  {filteredPositionsForSearch.filter(p => p.name.toLowerCase().includes(posSearch.toLowerCase())).map(pos => (
                    <div key={pos.id} onMouseDown={() => { setFilterPos(pos.id); setPosSearch(pos.name); setShowPosList(false); }} className="px-4 py-3 hover:bg-indigo-50 rounded-xl cursor-pointer text-sm font-bold text-slate-600">
                      {pos.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
                onClick={resetFilters}
                className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-colors"
                title="Сбросить фильтры"
            >
                <RotateCcw size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map(role => (
              <div key={role.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Layers size={24} /></div>
                    <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{role.department_name}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{role.name}</h3>
                  <p className="text-slate-400 text-sm mb-6 line-clamp-2 leading-relaxed">{role.description}</p>
                </div>
                <button onClick={() => startEdit(role)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-colors">Редактировать</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
              <h2 className="text-lg font-black mb-6 flex items-center gap-2 text-indigo-600"><Settings2 size={20}/> Параметры роли</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input 
                  value={roleName} 
                  onChange={e => setRoleName(e.target.value)} 
                  placeholder="Название роли" 
                  className="bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 ring-indigo-500" 
                />
                
                <div className="relative" ref={editDeptRef}>
                  <input 
                    type="text"
                    placeholder="Отдел..."
                    value={showEditorDeptList ? editorDeptSearch : (departments.find(d => d.id === selectedDept)?.name || '')}
                    onFocus={() => { setShowEditorDeptList(true); setEditorDeptSearch(''); }}
                    onChange={(e) => { setEditorDeptSearch(e.target.value); setSelectedDept(null); }}
                    className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 ring-indigo-500 cursor-pointer"
                  />

                  {selectedDept !== null && (
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDept(null);
                      setEditorDeptSearch('');
                    }}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}

                  <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showEditorDeptList ? 'rotate-180' : ''}`} />

                  {showEditorDeptList && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl max-h-52 overflow-y-auto p-2">
                      {departments.filter(d => d.name.toLowerCase().includes(editorDeptSearch.toLowerCase())).map(dept => (
                        <div key={dept.id} onMouseDown={() => { setSelectedDept(dept.id); setEditorDeptSearch(dept.name); setShowEditorDeptList(false); }} className="px-4 py-2.5 hover:bg-indigo-50 rounded-lg cursor-pointer text-sm font-bold text-slate-600">
                          {dept.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <textarea value={roleDesc} onChange={e => setRoleDesc(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-bold mb-6 min-h-[100px] resize-none" placeholder="Описание роли..." />
              
              <div className="flex flex-wrap gap-2 p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                {positions.filter(p => !selectedDept || p.department_id === selectedDept).map(pos => (
                  <button key={pos.id} onClick={() => setSelectedPos(prev => prev.includes(pos.id) ? prev.filter(id => id !== pos.id) : [...prev, pos.id])} className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border ${selectedPos.includes(pos.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}>{pos.name}</button>
                ))}
              </div>
            </div>

            {/* Итоговый профиль */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <h2 className="text-xl font-black mb-8 text-emerald-400 flex items-center gap-2 relative z-10"><CheckCircle2 size={20}/> Итоговый профиль</h2>
              <div className="space-y-3 relative z-10">
                {finalProfile.map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-5 rounded-2xl border ${item.source === 'merged' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-white/5'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.source === 'merged' || item.source === 'position' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-indigo-600'}`}>
                        {item.source === 'merged' ? <ArrowUpRight size={20}/> : <Layers size={20}/>}
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight">{item.name}</p>
                        <p className="text-[9px] font-black uppercase opacity-40 mt-1">{item.source === 'merged' ? 'Перекрыто должностью' : item.source === 'position' ? 'Из должности' : 'Прямое требование роли'}</p>
                      </div>
                    </div>
                    <div className="flex gap-8">
                       <div className="text-right"><p className="text-[8px] text-slate-500 uppercase font-black mb-1">Уровень</p><p className="text-xl font-black">{item.level}%</p></div>
                       <div className="text-right"><p className="text-[8px] text-slate-500 uppercase font-black mb-1">Вес</p><p className="text-xl font-black">{item.weight}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm sticky top-6">
              <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 text-indigo-600"><Plus size={20}/> Настройка компетенций</h3>
              
              <div className="space-y-3 mb-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {visibleDraft.map((item) => (
                  <div key={item.competency} className="bg-slate-50 p-5 rounded-2xl relative border border-transparent hover:border-indigo-100 transition-all group">
                    <button onClick={() => setDraft(draft.filter(d => d.competency !== item.competency))} className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 transition-colors"><X size={18}/></button>
                    <p className="text-[13px] font-bold text-slate-800 mb-4 pr-6">{item.competency_name}</p>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <p className="text-[8px] font-black uppercase text-slate-400 mb-1 ml-1">Уровень</p>
                        <input type="number" value={item.required_level} onChange={e => setDraft(draft.map(d => d.competency === item.competency ? {...d, required_level: Number(e.target.value)} : d))} className="w-full bg-white border border-slate-200 rounded-xl py-2 text-center font-black text-xs text-slate-600 focus:ring-2 ring-indigo-500/20" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[8px] font-black uppercase text-slate-400 mb-1 ml-1">Вес</p>
                        <input type="number" step="0.05" value={item.weight} onChange={e => setDraft(draft.map(d => d.competency === item.competency ? {...d, weight: Number(e.target.value)} : d))} className="w-full bg-white border border-slate-200 rounded-xl py-2 text-center font-black text-xs text-slate-600 focus:ring-2 ring-indigo-500/20" />
                      </div>
                      <div className="flex-1 flex flex-col justify-end">
                        <button onClick={() => setDraft(draft.map(d => d.competency === item.competency ? {...d, is_key: !d.is_key} : d))} className={`w-full py-2 rounded-xl text-[10px] font-black transition-all ${item.is_key ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>Ключевая</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-50 pt-6">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-4 ml-2 tracking-widest">Добавить компетенции</p>
                
                {/* Фильтр по категориям */}
                <div className="relative mb-4" ref={catRef}>
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text"
                    placeholder="Фильтр по категории..."
                    value={showCategoryList ? categorySearch : (categories.find(c => c.id === selectedCategory)?.name || '')}
                    onFocus={() => { setShowCategoryList(true); setCategorySearch(''); }}
                    onChange={(e) => { setCategorySearch(e.target.value); setSelectedCategory(null); }}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold cursor-pointer"
                  />
                  {selectedCategory !== null ? (
                    <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(null);
                      setCategorySearch('');
                    }}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                  <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showCategoryList ? 'rotate-180' : ''}`} />
                  
                  {showCategoryList && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-2">
                      <div onMouseDown={() => { setSelectedCategory(null); setCategorySearch(''); setShowCategoryList(false); }} className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-black uppercase text-indigo-600">Все категории</div>
                      {categories.filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase())).map(cat => (
                        <div key={cat.id} onMouseDown={() => { setSelectedCategory(cat.id); setCategorySearch(cat.name); setShowCategoryList(false); }} className="px-3 py-2.5 hover:bg-indigo-50 rounded-lg cursor-pointer text-[11px] font-bold text-slate-600">
                          {cat.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                  {availableCompetencies.map(c => (
                    <button key={c.id} onClick={() => setDraft([...draft, {competency: c.id, competency_name: c.name, required_level: 60, weight: 0.1, is_key: false}])} className="w-full text-left p-3 rounded-xl hover:bg-indigo-50 text-[12px] font-bold text-slate-600 flex justify-between group transition-all">
                      <span className="truncate pr-2">{c.name}</span>
                      <Plus size={14} className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-indigo-600" />
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSave} 
                disabled={loading} 
                className="w-full mt-8 bg-indigo-600 text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50">
                {loading ? 'Обработка...' : (editingRoleId ? 'Сохранить изменения' : 'Создать новую роль')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}