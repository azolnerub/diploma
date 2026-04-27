import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { ChevronDown, CheckCircle2, AlertCircle, History, User, Award, MessageSquare, ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Competency {
  id: number;
  name: string;
  description?: string;
  required_level?: number;
  is_key?: boolean;
}

interface Evaluation {
  id: number;
  competency_name: string;
  value: number;
  date: string;
  comment: string;
}

export default function EvaluateEmployee() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [employee, setEmployee] = useState<any>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  
  const [activeId, setActiveId] = useState<number | null>(null);
  const [pendingEvaluations, setPendingEvaluations] = useState<Record<number, { score: number, comment: string }>>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Стейт для управления раскрытыми датами в истории
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // Группировка истории по датам
  const groupedHistory = useMemo(() => {
    const groups: Record<string, Evaluation[]> = {};
    evaluations.forEach(ev => {
      const date = new Date(ev.date).toLocaleDateString('ru-RU');
      if (!groups[date]) groups[date] = [];
      groups[date].push(ev);
    });
    return Object.entries(groups).sort((a, b) => 
      new Date(b[0].split('.').reverse().join('-')).getTime() - 
      new Date(a[0].split('.').reverse().join('-')).getTime()
    );
  }, [evaluations]);

  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return;
      try {
        const empRes = await api.get(`employees/${id}/`);
        const targetEmployee = empRes.data;
        setEmployee(targetEmployee);

        const [evalRes, profileRes, rolesRes] = await Promise.allSettled([
          api.get(`employees/${id}/evaluations/`),
          api.get(`positions/${targetEmployee.position_id}/profile/`),
          api.get(`positions/${targetEmployee.position_id}/competencies-from-roles/`)
        ]);

        if (evalRes.status === 'fulfilled') setEvaluations(evalRes.value.data);

        const compMap = new Map<number, Competency>();

        if (rolesRes.status === 'fulfilled' && Array.isArray(rolesRes.value.data)) {
          rolesRes.value.data.forEach((c: any) => {
            compMap.set(Number(c.id), {
              id: Number(c.id),
              name: c.name,
              description: c.description,
              required_level: c.required_level ? Number(c.required_level) : 0,
              is_key: Boolean(c.is_key)
            });
          });
        }

        if (profileRes.status === 'fulfilled' && Array.isArray(profileRes.value.data)) {
          profileRes.value.data.forEach((p: any) => {
            const cid = Number(p.competency);
            const existing = compMap.get(cid);
            compMap.set(cid, {
              id: cid,
              name: p.competency_name || existing?.name,
              description: p.description || existing?.description,
              required_level: p.required_level ? Number(p.required_level) : (existing?.required_level || 0),
              is_key: Boolean(p.is_key) || Boolean(existing?.is_key)
            });
          });
        }

        setCompetencies(Array.from(compMap.values()));
      } catch (err) {
        console.error("Ошибка при загрузке данных оценки:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, authLoading]);

  const isFormComplete = useMemo(() => {
    return competencies.length > 0 && competencies.every(c => pendingEvaluations[c.id] !== undefined);
  }, [competencies, pendingEvaluations]);

  const handleFinalSave = async () => {
    if (!isFormComplete) return;
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(pendingEvaluations).map(([compId, data]) => 
          api.post(`employees/${id}/competencies/add/`, {
            competency_id: Number(compId),
            value: data.score,
            comment: data.comment.trim() || (user?.role === 'director' ? "Оценка директора" : "Оценка руководителя")
          })
        )
      );
    } catch {
      alert("Не удалось сохранить оценки. Попробуйте позже.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
      <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">Загрузка матрицы компетенций...</span>
    </div>
  );

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto bg-slate-50 min-h-screen font-sans">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 gap-8">
        <div className="animate-in slide-in-from-left duration-700">
          <button 
            onClick={() => navigate(-1)} 
            className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm transition-all mb-6"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Назад
          </button>
          <div className="flex flex-wrap items-center gap-4">
             <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">
              {employee?.full_name}
            </h1>
            <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase text-slate-400 tracking-widest shadow-sm">
              Форма оценивания
            </span>
          </div>
          <p className="text-lg text-slate-500 mt-3 font-medium flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <User size={16} className="text-indigo-600" />
            </span>
            {employee?.position_name} 
            <span className="text-slate-300">•</span> 
            <span className="text-slate-400">{employee?.department_name}</span>
          </p>
        </div>

        <div className="w-full xl:w-auto bg-white p-6 md:p-8 rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-white flex flex-col md:flex-row items-center gap-8 animate-in zoom-in duration-500">
          <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Оценено</p>
                <p className="text-3xl font-black text-slate-900 leading-none">
                    {Object.keys(pendingEvaluations).length} <span className="text-slate-200">/</span> {competencies.length}
                </p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-slate-50 flex items-center justify-center relative">
                <svg className="w-full h-full -rotate-90">
                    <circle 
                        cx="32" cy="32" r="28" fill="transparent" 
                        stroke="currentColor" strokeWidth="4" 
                        className="text-slate-100" 
                    />
                    <circle 
                        cx="32" cy="32" r="28" fill="transparent" 
                        stroke="currentColor" strokeWidth="4" 
                        strokeDasharray={176}
                        strokeDashoffset={176 - (176 * (Object.keys(pendingEvaluations).length / (competencies.length || 1)))}
                        className="text-indigo-600 transition-all duration-1000"
                    />
                </svg>
                <CheckCircle2 className="absolute text-indigo-600" size={20} />
            </div>
          </div>
          
          <button
            onClick={handleFinalSave}
            disabled={!isFormComplete || saving}
            className={`w-full md:w-auto px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 ${
              isFormComplete 
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:-translate-y-1' 
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            {saving ? 'Сохранение...' : 'Сохранить оценку'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-4 mb-4">
             <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Требуемые навыки</h3>
             {isFormComplete && (
                 <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 px-3 py-1 rounded-full animate-bounce">
                     Оценка проведена!
                 </span>
             )}
          </div>
          
          {competencies.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
                <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Компетенции не найдены...</p>
            </div>
          ) : (
            competencies.map((c) => {
                const isEvaled = pendingEvaluations[c.id] !== undefined;
                const isActive = activeId === c.id;
    
                return (
                  <div 
                    key={c.id} 
                    className={`group transition-all duration-500 rounded-[2.5rem] border ${
                      isActive 
                        ? 'bg-white border-indigo-100 shadow-2xl shadow-indigo-100/50 scale-[1.01]' 
                        : 'bg-white/70 border-white hover:border-slate-200'
                    }`}
                  >
                    <div 
                      onClick={() => setActiveId(isActive ? null : c.id)}
                      className="p-8 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 ${
                          isEvaled ? 'bg-emerald-500 text-white rotate-[360deg]' : isActive ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-300'
                        }`}>
                          {isEvaled ? <CheckCircle2 size={28} /> : <Award size={28} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className={`text-xl font-black tracking-tight transition-colors ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                                {c.name}
                            </h4>
                            {c.is_key && <span className="text-[9px] font-black uppercase bg-rose-100 text-rose-500 px-2 py-1 rounded-lg">Ключевая</span>}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                             <p className="text-xs font-bold text-slate-400">Цель: <span className="text-indigo-500">{c.required_level || 0}%</span></p>
                             {isEvaled && (
                                 <span className="text-xs font-black text-emerald-500">Выставлено: {pendingEvaluations[c.id].score}%</span>
                             )}
                          </div>
                        </div>
                      </div>
                      <ChevronDown className={`text-slate-200 transition-transform duration-500 ${isActive ? 'rotate-180 text-indigo-600' : 'group-hover:text-slate-400'}`} />
                    </div>
    
                    <AnimatePresence>
                      {isActive && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-8 pb-8 pt-2">
                            <div className="bg-slate-50/80 rounded-[2rem] p-8">
                                <p className="text-slate-500 mb-10 leading-relaxed font-medium text-sm border-l-4 border-indigo-100 pl-6">
                                    {c.description || 'Инструкции и описание для данной компетенции не заполнены.'}
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                  <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Уровень мастерства</label>
                                      <span className="text-5xl font-black text-indigo-600 tracking-tighter">
                                        {pendingEvaluations[c.id]?.score ?? 50}<span className="text-2xl text-indigo-200">%</span>
                                      </span>
                                    </div>
                                    <input 
                                      type="range"
                                      min="0" max="100" step="1"
                                      value={pendingEvaluations[c.id]?.score ?? 50}
                                      onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setPendingEvaluations(prev => ({
                                              ...prev,
                                              [c.id]: { score: val, comment: prev[c.id]?.comment || '' }
                                          }));
                                      }}
                                      className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer accent-indigo-600 border border-slate-100 shadow-sm"
                                    />
                                    <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase">
                                        <span>Новичок</span>
                                        <span>Эксперт</span>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Комментарий руководителя</label>
                                    <div className="relative group">
                                      <MessageSquare className="absolute left-5 top-5 text-slate-300 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                      <textarea 
                                        placeholder="Опишите сильные стороны или зоны роста..."
                                        value={pendingEvaluations[c.id]?.comment ?? ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setPendingEvaluations(prev => ({
                                                ...prev,
                                                [c.id]: { score: prev[c.id]?.score ?? 50, comment: val }
                                            }));
                                        }}
                                        className="w-full h-32 pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[1.5rem] text-sm focus:ring-4 ring-indigo-500/5 focus:border-indigo-200 transition-all resize-none font-medium text-slate-700 shadow-inner"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-10 flex justify-end">
                                  <button 
                                    onClick={() => {
                                      if (pendingEvaluations[c.id] === undefined) {
                                          setPendingEvaluations(prev => ({ ...prev, [c.id]: { score: 50, comment: '' } }));
                                      }
                                      setActiveId(null);
                                    }}
                                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-200"
                                  >
                                    Подтвердить
                                  </button>
                                </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
            })
          )}
        </div>

        {/* СЕКЦИЯ ИСТОРИИ - ОБНОВЛЕННАЯ ЛОГИКА (АККОРДЕОН) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[3rem] p-8 border border-white shadow-xl shadow-slate-200/40">
            <h4 className="font-black text-slate-900 flex items-center gap-3 mb-8 uppercase text-xs tracking-widest">
              <History size={18} className="text-indigo-500" /> История по сессиям
            </h4>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {groupedHistory.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-100">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter italic">История пуста...</p>
                </div>
              ) : (
                groupedHistory.map(([date, items]) => {
                  const isExpanded = !!expandedDates[date];
                  return (
                    <div key={date} className="overflow-hidden border-b border-slate-50 pb-2">
                      <button 
                        onClick={() => toggleDate(date)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                          isExpanded ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <Calendar size={14} />
                          </div>
                          <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                            Оценка от {date}
                          </span>
                        </div>
                        <ChevronDown 
                          size={16} 
                          className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} 
                        />
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-3 pt-4 pl-4 pr-2 pb-2">
                              {items.map(ev => (
                                <div key={ev.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all group">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-slate-700 text-[11px] uppercase tracking-tight">{ev.competency_name}</span>
                                    <span className="text-sm font-black text-indigo-600">{ev.value}%</span>
                                  </div>
                                  {ev.comment && (
                                    <p className="mt-2 text-[10px] text-slate-500 leading-relaxed italic border-t border-slate-50 pt-2">
                                      {ev.comment}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
            <h4 className="font-black mb-6 uppercase text-[10px] tracking-[0.3em] text-indigo-400">Советы по оценке</h4>
            <div className="space-y-6 relative z-10">
              <div className="flex gap-4">
                  <div className="shrink-0 w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-300">1</div>
                  <p className="text-xs text-slate-400 leading-relaxed">Используйте ползунок для определения уровня навыка относительно <span className="text-white">целевого значения</span>.</p>
              </div>
              <div className="flex gap-4">
                  <div className="shrink-0 w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-300">2</div>
                  <p className="text-xs text-slate-400 leading-relaxed">Кнопка <span className="text-white">«Зафиксировать всё»</span> отправит данные сразу по всем навыкам сотрудника.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}