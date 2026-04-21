import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { Target, Trash2, BookOpen, Layers, Briefcase, Scale, Loader2, PlusCircle, CheckCircle2, Plus, ArrowUpFromDot } from 'lucide-react';

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

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | ''>('');
  const [selectedPositionId, setSelectedPositionId] = useState<number | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');

  const [newCompName, setNewCompName] = useState('');
  const [newCompDescription, setNewCompDescription] = useState('');
  const [newCompCategoryId, setNewCompCategoryId] = useState<number | ''>('');

  const [currentCompetencyId, setCurrentCompetencyId] = useState<number | ''>('');
  const [currentLevel, setCurrentLevel] = useState<number | ''>(60);
  const [currentWeight, setCurrentWeight] = useState<number | ''>(0.15);
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
    if (!selectedPositionId) { setPositionProfiles([]); return; }
    const loadProfile = async () => {
      try {
        const res = await api.get(`positions/${selectedPositionId}/profile/`);
        setPositionProfiles(res.data);
      } catch { setPositionProfiles([]); }
    };
    loadProfile();
  }, [selectedPositionId]);

  const filteredPositions = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return positions.filter(p => p.department_id === Number(selectedDepartmentId));
  }, [positions, selectedDepartmentId]);

  const availableCompetencies = useMemo(() => {
    const usedIds = new Set(positionProfiles.map(p => p.competency));
    return competencies.filter(c => {
      const notUsed = !usedIds.has(c.id);
      const compCatId = typeof c.category === 'object' ? c.category?.id : c.category;
      return notUsed && (!categoryFilter || compCatId === Number(categoryFilter));
    });
  }, [competencies, positionProfiles, categoryFilter]);

  const addCompetencyToPosition = async () => {
    if (!selectedPositionId || !currentCompetencyId) return;
    setSavingProfile(true);
    try {
      await api.post(`positions/${selectedPositionId}/profile/`, {
        competency: currentCompetencyId,
        required_level: currentLevel || 0,
        weight: currentWeight || 0,
        is_key: currentIsKey
      });
      const res = await api.get(`positions/${selectedPositionId}/profile/`);
      setPositionProfiles(res.data);
      setCurrentCompetencyId(''); setCurrentLevel(60); setCurrentWeight(0.15); setCurrentIsKey(false);
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
      await api.delete(`positions/${selectedPositionId}/profile/${profileId}/`);
      setPositionProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch { alert('Ошибка удаления'); }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
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
        <div className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl animate-in fade-in slide-in-from-right-4 shadow-2xl">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-xs font-black uppercase tracking-widest">{successMessage}</span>
        </div>
      )}
    </div>

    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[3rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-indigo-100/40 w-full">
        <div className="space-y-4">
          <div className="flex items-center gap-2 ml-1 text-slate-400">
            <Layers size={14} />
            <label className="text-[10px] font-black uppercase tracking-[0.2em]">Отдел</label>
          </div>
          <select 
            value={selectedDepartmentId} 
            onChange={e => { setSelectedDepartmentId(e.target.value ? Number(e.target.value) : ''); setSelectedPositionId(''); }}
            className="w-full px-6 py-5 bg-slate-50/80 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all font-bold text-slate-700 text-lg appearance-none cursor-pointer"
          >
            <option value="">Выберите отдел...</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 ml-1 text-slate-400">
            <Briefcase size={14} />
            <label className="text-[10px] font-black uppercase tracking-[0.2em]">Должность</label>
          </div>
          <select 
            value={selectedPositionId} 
            onChange={e => setSelectedPositionId(e.target.value ? Number(e.target.value) : '')}
            disabled={!selectedDepartmentId}
            className="w-full px-6 py-5 bg-slate-50/80 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all font-bold text-slate-700 text-lg appearance-none disabled:opacity-20 cursor-pointer"
          >
            <option value="">Выберите должность...</option>
            {filteredPositions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
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
            {!selectedPositionId ? (
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-2">Категории</label>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value ? Number(e.target.value) : '')} className="w-full px-6 py-4 bg-white border-none rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-xs">
                      <option value="">Все категории</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-2">Компетенции</label>
                    <select value={currentCompetencyId} onChange={e => setCurrentCompetencyId(e.target.value ? Number(e.target.value) : '')} className="w-full px-6 py-4 bg-white border-none rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-xs">
                      <option value="">Выберите компетенцию...</option>
                      {availableCompetencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black text-black-400 uppercase tracking-widest">Требуемый уровень владения</label>
                        <ArrowUpFromDot size={14} className="text-black-300"/>
                      </div>
                      <input type="number" min="0" max="100" value={currentLevel} onChange={e => setCurrentLevel(e.target.value === '' ? '' : Math.min(100, Number(e.target.value)))} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-black text-slate-700 outline-none text-sm" placeholder="0-100" />
                    </div>
                    <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black text-black-400 uppercase tracking-widest">Вес компетенции</label>
                        <Scale size={14} className="text-black-300" />
                      </div>
                      <input type="number" step="0.05" min="0" max="1" value={currentWeight} onChange={e => setCurrentWeight(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-black text-slate-700 outline-none text-sm" placeholder="0.0 - 1.0" />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 flex items-center gap-4 bg-white/60 backdrop-blur px-8 py-5 rounded-3xl border border-white cursor-pointer group" onClick={() => setCurrentIsKey(!currentIsKey)}>
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${currentIsKey ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200' : 'border-slate-200 bg-white'}`}>
                      {currentIsKey && <CheckCircle2 size={14} className="text-white" />}</div>
                      <label className="text-[10px] font-black text-black-600 uppercase tracking-widest cursor-pointer">Ключевая компетенция</label>
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

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Категория</label>
              <select value={newCompCategoryId} onChange={e => setNewCompCategoryId(e.target.value ? Number(e.target.value) : '')} className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm outline-none focus:border-emerald-500 text-white appearance-none">
                <option value="" className="text-slate-900">Выберите категорию...</option>
                {categories.map(c => <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>)}
              </select>
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