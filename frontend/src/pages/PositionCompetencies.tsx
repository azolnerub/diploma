import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../api/axios';
import { Target, Trash2, BookOpen, Layers, Briefcase, Scale, Loader2, PlusCircle, CheckCircle2, Plus, ArrowUpFromDot, ChevronDown, Tag, X, GraduationCap } from 'lucide-react';

interface Department { id: number; name: string }
interface Position { id: number; name: string; department_id?: number }
interface Category { id: number; name: string }
interface Competency { 
  id: number; 
  name: string; 
  description: string; 
  category?: number | { id: number; name: string } 
}

interface PositionProfileItem {
  id?: number;
  competency: number;
  competency_name: string;
  required_level: number;
  weight: number;
  is_key: boolean;
}

export default function PositionCompetencies() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [selectedPos, setSelectedPos] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

  const [deptSearch, setDeptSearch] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [showDeptList, setShowDeptList] = useState(false);
  const [showPosList, setShowPosList] = useState(false);
  const [showCatList, setShowCatList] = useState(false);

  const [addCompSearch, setAddCompSearch] = useState('');
  const [showAddCompList, setShowAddCompList] = useState(false);
  const [libCatSearch, setLibCatSearch] = useState('');
  const [showLibCatList, setShowLibCatList] = useState(false);

  const deptRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const addCompRef = useRef<HTMLDivElement>(null);
  const libCatRef = useRef<HTMLDivElement>(null);

  const [newCompName, setNewCompName] = useState('');
  const [newCompDescription, setNewCompDescription] = useState('');
  const [newCompCategoryId, setNewCompCategoryId] = useState<number | ''>('');

  const [currentCompetencyId, setCurrentCompetencyId] = useState<number | ''>('');
  const [currentLevel, setCurrentLevel] = useState<string>('60');
  const [currentWeight, setCurrentWeight] = useState<string>('0.15');
  const [currentIsKey, setCurrentIsKey] = useState(false);

  const [positionProfiles, setPositionProfiles] = useState<PositionProfileItem[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNewComp, setSavingNewComp] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const totalWeight = useMemo(() => {
    return positionProfiles.reduce((sum, p) => sum + p.weight, 0).toFixed(2);
  }, [positionProfiles]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptRes, posRes, compRes, catRes] = await Promise.all([
          api.get('departments/'), api.get('positions/'), api.get('competencies/'), api.get('categories/')
        ]);
        setDepartments(deptRes.data); setPositions(posRes.data); setCompetencies(compRes.data); setCategories(catRes.data);
      } catch (err) { console.error(err); }
    };
    loadData();
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) setShowDeptList(false);
      if (posRef.current && !posRef.current.contains(e.target as Node)) setShowPosList(false);
      if (catRef.current && !catRef.current.contains(e.target as Node)) setShowCatList(false);
      if (addCompRef.current && !addCompRef.current.contains(e.target as Node)) setShowAddCompList(false);
      if (libCatRef.current && !libCatRef.current.contains(e.target as Node)) setShowLibCatList(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!selectedPos) { setPositionProfiles([]); return; }
    const loadProfile = async () => {
      try {
        const res = await api.get(`positions/${selectedPos}/profile/`);
        setPositionProfiles(res.data);
      } catch { setPositionProfiles([]); }
    };
    loadProfile();
  }, [selectedPos]);

  const filteredPositions = useMemo(() => {
    if (!selectedDept) return [];
    return positions.filter(p => p.department_id === Number(selectedDept));
  }, [positions, selectedDept]);

  const availableCompetencies = useMemo(() => {
    const usedIds = new Set(positionProfiles.map(p => p.competency));
    return competencies.filter(c => {
      const notUsed = !usedIds.has(c.id);
      const compCatId = typeof c.category === 'object' ? c.category?.id : c.category;
      return notUsed && (!categoryFilter || compCatId === Number(categoryFilter));
    });
  }, [competencies, positionProfiles, categoryFilter]);

  const addCompetencyToPosition = async () => {
    if (!selectedPos || !currentCompetencyId) return;
    setSavingProfile(true);
    try {
      await api.post(`positions/${selectedPos}/profile/`, {
        competency: currentCompetencyId,
        required_level: Number(currentLevel) || 0,
        weight: Number(currentWeight) || 0,
        is_key: currentIsKey
      });
      const res = await api.get(`positions/${selectedPos}/profile/`);
      setPositionProfiles(res.data);
      setCurrentCompetencyId(''); setCurrentLevel('60'); setCurrentWeight('0.15'); setCurrentIsKey(false);
      showSuccess("Профиль обновлен");
    } catch { alert('Ошибка при добавлении'); } finally { setSavingProfile(false); }
  };

  const createNewCompetency = async () => {
    if (!newCompName.trim() || !newCompCategoryId) return;
    setSavingNewComp(true);
    try {
      await api.post('competencies/', {
        name: newCompName.trim(), description: newCompDescription.trim(), category: newCompCategoryId
      });
      const res = await api.get('competencies/');
      setCompetencies(res.data);
      setNewCompName(''); setNewCompDescription(''); setNewCompCategoryId('');
      showSuccess("Компетенция добавлена");
    } catch { alert("Ошибка создания"); } finally { setSavingNewComp(false); }
  };

  const removeCompetency = async (profileId: number) => {
    if (!confirm('Исключить из профиля?')) return;
    try {
      await api.delete(`positions/${selectedPos}/profile/${profileId}/`);
      setPositionProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch { alert('Ошибка удаления'); }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleLevelChange = (val: string) => {
    if (val === '') { setCurrentLevel(''); return; }
    const num = Number(val);
    if (!isNaN(num) && num <= 100) {
      setCurrentLevel(val);
    }
  };

  const handleWeightChange = (val: string) => {
    if (val === '') { setCurrentWeight(''); return; }
    // Регулярное выражение: позволяет вводить число от 0 до 1 с максимумом 2 знаками после запятой
    if (/^(0|0\.\d{0,2}|1|1\.0{0,2})$/.test(val)) {
      setCurrentWeight(val);
    }
  };

  return (
    <div className="p-4 md:p-10 md:pl-8 max-w-[1600px] ml-0 space-y-12 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
            Матрица <span className="text-indigo-600">компетенций</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm ml-1">Проектирование эталонных требований к должностям</p>
        </div>
        
        {successMessage && (
          <div className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-widest">{successMessage}</span>
          </div>
        )}
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[3rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-indigo-100/40 w-full">
          <div className="space-y-4" ref={deptRef}>
            <div className="flex items-center gap-2 ml-1 text-slate-400">
              <Layers size={14} />
              <label className="text-[10px] font-black uppercase tracking-[0.2em]">Отдел</label>
            </div>
            <div className="relative">
              <input 
                type="text"
                placeholder="Выберите отдел..."
                value={showDeptList ? deptSearch : (departments.find(d => d.id === selectedDept)?.name || '')}
                onFocus={() => { setShowDeptList(true); setDeptSearch(''); }}
                onChange={(e) => { setDeptSearch(e.target.value); setSelectedDept(null); }}
                className="w-full px-6 py-5 bg-slate-50/80 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all font-bold text-slate-700 text-lg cursor-pointer pr-14"
              />
              {selectedDept !== null && (
                <button onClick={() => { setSelectedDept(null); setSelectedPos(null); }} className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500">
                  <X size={16} />
                </button>
              )}
              <ChevronDown size={20} className={`absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showDeptList ? 'rotate-180' : ''}`} />
              {showDeptList && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl max-h-60 overflow-y-auto p-2">
                  {departments.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase())).map(d => (
                    <div key={d.id} onMouseDown={() => { setSelectedDept(d.id); setSelectedPos(null); setShowDeptList(false); }} className="px-6 py-4 hover:bg-indigo-50 rounded-2xl cursor-pointer font-bold text-slate-600">
                      {d.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4" ref={posRef}>
            <div className="flex items-center gap-2 ml-1 text-slate-400">
              <Briefcase size={14} />
              <label className="text-[10px] font-black uppercase tracking-[0.2em]">Должность</label>
            </div>
            <div className="relative">
              <input 
                type="text"
                placeholder="Выберите должность..."
                disabled={!selectedDept}
                value={showPosList ? posSearch : (positions.find(p => p.id === selectedPos)?.name || '')}
                onFocus={() => { setShowPosList(true); setPosSearch(''); }}
                onChange={(e) => { setPosSearch(e.target.value); setSelectedPos(null); }}
                className="w-full px-6 py-5 bg-slate-50/80 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all font-bold text-slate-700 text-lg cursor-pointer disabled:opacity-30 pr-14"
              />
              {selectedPos !== null && (
                <button onClick={() => setSelectedPos(null)} className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500">
                  <X size={16} />
                </button>
              )}
              <ChevronDown size={20} className={`absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showPosList ? 'rotate-180' : ''}`} />
              {showPosList && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl max-h-60 overflow-y-auto p-2">
                  {filteredPositions.filter(p => p.name.toLowerCase().includes(posSearch.toLowerCase())).map(p => (
                    <div key={p.id} onMouseDown={() => { setSelectedPos(p.id); setShowPosList(false); }} className="px-6 py-4 hover:bg-indigo-50 rounded-2xl cursor-pointer font-bold text-slate-600">
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full">
        <div className="lg:col-span-12 space-y-10">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none italic">Настройка идеального профиля</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-0.5">Список требующихся компетенций</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Суммарный вес</p>
                  <p className={`text-xl font-black tracking-tighter ${Number(totalWeight) > 1 ? 'text-rose-500' : 'text-slate-900'}`}>{totalWeight}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Target size={24} />
                </div>
              </div>
            </div>

            <div className="p-10 space-y-8">
              {!selectedPos ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 grayscale opacity-40">
                  <Target size={60} className="text-slate-300" />
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 max-w-[240px]">Ничего не выбрано</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    {positionProfiles.length === 0 && (
                      <p className="text-center py-10 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-slate-100 rounded-[2rem]">В профиле пока пусто</p>
                    )}
                    {positionProfiles.map(item => (
                      <div key={item.id} className="group bg-white p-6 rounded-[2rem] border border-slate-100 hover:shadow-lg transition-all duration-300 flex justify-between items-center">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-black text-slate-800 tracking-tight text-lg leading-none">{item.competency_name}</h3>
                            {item.is_key && <span className="px-2.5 py-1 bg-rose-500 text-white text-[8px] font-black uppercase rounded-lg shadow-lg shadow-rose-200 tracking-widest">Ключевая</span>}
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                             <span className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">Уровень: <span className="text-sm font-black text-slate-900">{item.required_level}%</span></span>
                             <span className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">Вес: <span className="text-sm font-black text-indigo-600">{item.weight}</span></span>
                          </div>
                        </div>
                        <button onClick={() => removeCompetency(item.id!)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-20 p-10 bg-indigo-50/40 rounded-[3rem] border border-indigo-50 space-y-10">
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center"><Plus size={18} /></div>
                       <h3 className="font-black text-indigo-900 uppercase tracking-[0.2em] text-xs">Добавление компетенций</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3" ref={catRef}>
                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-2">Категория</label>
                        <div className="relative">
                          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input
                            type="text"
                            placeholder="Поиск категории..."
                            value={showCatList ? catSearch : (categories.find(c => c.id === categoryFilter)?.name || 'Все категории')}
                            onFocus={() => { setShowCatList(true); setCatSearch(''); }}
                            onChange={(e) => { setCatSearch(e.target.value); setCategoryFilter(null); }}
                            className="w-full pl-12 pr-12 py-4 bg-white border-none rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-xs cursor-pointer"
                          />
                          {categoryFilter !== null && (
                            <button onClick={() => setCategoryFilter(null)} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500">
                              <X size={12} />
                            </button>
                          )}
                          <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showCatList ? 'rotate-180' : ''}`} />
                          {showCatList && (
                            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-2">
                              <div onMouseDown={() => { setCategoryFilter(null); setShowCatList(false); }} className="px-4 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-black uppercase text-indigo-600">Все категории</div>
                              {categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).map(c => (
                                <div key={c.id} onMouseDown={() => { setCategoryFilter(c.id); setShowCatList(false); }} className="px-4 py-2 hover:bg-indigo-50 rounded-lg cursor-pointer text-xs font-bold text-slate-600">
                                  {c.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3" ref={addCompRef}>
                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-2">Компетенция</label>
                        <div className="relative">
                          <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input
                            type="text"
                            placeholder="Выберите компетенцию..."
                            value={showAddCompList ? addCompSearch : (competencies.find(c => c.id === currentCompetencyId)?.name || '')}
                            onFocus={() => { setShowAddCompList(true); setAddCompSearch(''); }}
                            onChange={(e) => { setAddCompSearch(e.target.value); setCurrentCompetencyId(''); }}
                            className="w-full pl-12 pr-12 py-4 bg-white border-none rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-xs cursor-pointer"
                          />
                          {currentCompetencyId !== '' && (
                            <button onClick={() => setCurrentCompetencyId('')} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500">
                              <X size={12} />
                            </button>
                          )}
                          <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showAddCompList ? 'rotate-180' : ''}`} />
                          {showAddCompList && (
                            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-2">
                              {availableCompetencies.filter(c => c.name.toLowerCase().includes(addCompSearch.toLowerCase())).map(c => (
                                <div key={c.id} onMouseDown={() => { setCurrentCompetencyId(c.id); setShowAddCompList(false); }} className="px-4 py-2 hover:bg-indigo-50 rounded-lg cursor-pointer text-xs font-bold text-slate-600">
                                  {c.name}
                                </div>
                              ))}
                              {availableCompetencies.filter(c => c.name.toLowerCase().includes(addCompSearch.toLowerCase())).length === 0 && (
                                <div className="px-4 py-2 text-[10px] text-slate-400 font-bold uppercase italic">Нет доступных</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Требуемый уровень владения</label>
                          <ArrowUpFromDot size={14} className="text-slate-300"/>
                        </div>
                        <input 
                          type="text" 
                          value={currentLevel} 
                          onChange={e => handleLevelChange(e.target.value)} 
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-black text-slate-700 outline-none text-sm" 
                          placeholder="0-100" 
                        />
                      </div>
                      <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Вес компетенции</label>
                          <Scale size={14} className="text-slate-300" />
                        </div>
                        <input 
                          type="text" 
                          value={currentWeight} 
                          onChange={e => handleWeightChange(e.target.value)} 
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-black text-slate-700 outline-none text-sm" 
                          placeholder="0.00" 
                        />
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 flex items-center gap-4 bg-white/60 backdrop-blur px-8 py-5 rounded-3xl border border-white cursor-pointer group" onClick={() => setCurrentIsKey(!currentIsKey)}>
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${currentIsKey ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200' : 'border-slate-200 bg-white'}`}>
                        {currentIsKey && <CheckCircle2 size={14} className="text-white" />}</div>
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer">Ключевая компетенция</label>
                        </div>
                      <button 
                          onClick={addCompetencyToPosition} disabled={savingProfile || !currentCompetencyId}
                          className="md:w-80 bg-indigo-600 hover:bg-slate-900 disabled:opacity-30 text-white font-black uppercase text-[11px] tracking-[0.2em] py-6 rounded-[2rem] shadow-2xl shadow-indigo-200 transition-all duration-500 active:scale-95 flex items-center justify-center gap-3"
                        >
                        {savingProfile ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />} Добавить компетенцию
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 sticky top-10">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl space-y-8 w-full">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                <BookOpen size={22} />
              </div>
              <h3 className="font-black uppercase tracking-widest text-[11px]">Библиотека компетенций</h3>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Название</label>
                <input type="text" value={newCompName} onChange={e => setNewCompName(e.target.value)} placeholder="Введите название.." className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-emerald-500 font-bold text-sm" />
              </div>

              <div className="space-y-2" ref={libCatRef}>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Категория</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Выберите категорию..."
                    value={showLibCatList ? libCatSearch : (categories.find(c => c.id === newCompCategoryId)?.name || '')}
                    onFocus={() => { setShowLibCatList(true); setLibCatSearch(''); }}
                    onChange={(e) => { setLibCatSearch(e.target.value); setNewCompCategoryId(''); }}
                    className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-emerald-500 font-bold text-sm text-white cursor-pointer pr-12" 
                  />
                  <ChevronDown size={16} className={`absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 transition-transform ${showLibCatList ? 'rotate-180' : ''}`} />
                  {showLibCatList && (
                    <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-2">
                      {categories.filter(c => c.name.toLowerCase().includes(libCatSearch.toLowerCase())).map(c => (
                        <div key={c.id} onMouseDown={() => { setNewCompCategoryId(c.id); setShowLibCatList(false); }} className="px-4 py-3 hover:bg-slate-700 rounded-lg cursor-pointer text-xs font-bold text-slate-300">
                          {c.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Описание компетенции</label>
                <textarea 
                  value={newCompDescription} onChange={e => setNewCompDescription(e.target.value)}
                  placeholder="Опишите компетенцию..." rows={4}
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-sm focus:border-emerald-500 resize-none leading-relaxed transition-all"
                />
              </div>

              <button 
                onClick={createNewCompetency} disabled={!newCompName.trim() || !newCompCategoryId || savingNewComp}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-20 text-slate-900 font-black uppercase text-[11px] tracking-[0.2em] py-5 rounded-3xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
              >{savingNewComp ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />} Добавить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}