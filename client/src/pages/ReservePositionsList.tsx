import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Users, Search, Filter, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

interface PositionWithCandidates {
  id: number;
  name: string;
  department_name: string;
  department_id: number;
  candidate_count: number;
  avg_match: number;
}

interface RawPositionResponse {
  id: number;
  name: string;
  department_name: string;
  department_id: number; 
  candidate_count?: number;
  avg_match?: number;
}

interface Department {
  id: number;
  name: string;
}

export default function ReservePositionsList() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [positions, setPositions] = useState<PositionWithCandidates[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [posSearch, setPosSearch] = useState('');
  const [selectedPos, setSelectedPos] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [deptSearch, setDeptSearch] = useState('');

  const [showPosList, setShowPosList] = useState(false);
  const [showDeptList, setShowDeptList] = useState(false);

  const posRef = useRef<HTMLDivElement>(null);
  const deptRef = useRef<HTMLDivElement>(null);

  const getDeptId = (userData: any): number | null => {
    if (!userData || !userData.department) return null;
    const dept = userData.department;
    if (typeof dept === 'object' && dept !== null && 'id' in dept) {
      return Number(dept.id);
    }
    const parsed = Number(dept);
    return isNaN(parsed) ? null : parsed;
  };

  useEffect(() => {
    setSelectedPos(null);
    setPosSearch('');
  }, [selectedDept]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [posRes, deptRes] = await Promise.all([
          api.get<RawPositionResponse[]>('/positions/'),
          api.get<Department[]>('/departments/')
        ]);

        const formatted: PositionWithCandidates[] = posRes.data.map((p) => ({
          id: p.id,
          name: p.name,
          department_id: p.department_id,
          department_name: p.department_name, 
          candidate_count: p.candidate_count || 0,
          avg_match: Math.round(p.avg_match || 0)
        }));

        setPositions(formatted);
        setAllDepartments(deptRes.data);
      } catch {
        setError('Не удалось загрузить данные.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (posRef.current && !posRef.current.contains(event.target as Node)) setShowPosList(false);
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) setShowDeptList(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const uniquePositions = useMemo(() => {
    let base = positions;
    const userDeptId = getDeptId(user);

    if (user?.role !== 'hr') {
      if(userDeptId !== null) {
        base = base.filter(p => p.department_id === userDeptId);
      }
    } else {
      if (selectedDept !== null) {
        base = base.filter(p => p.department_id === selectedDept);
      }
    }

    const names = base.map(p => p.name).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [positions, user, selectedDept]);

  const filteredPositions = useMemo(() => {
    const userDeptId = getDeptId(user);

    return positions.filter(pos => {
      const matchPos = selectedPos 
        ? pos.name === selectedPos 
        : pos.name.toLowerCase().includes(posSearch.toLowerCase());

      let matchDept = true;
      if (user?.role !== 'hr') {
        matchDept = userDeptId !== null ? pos.department_id === userDeptId : true;
      } else {
        matchDept = !selectedDept || pos.department_id === selectedDept;
      }
    
      return matchPos && matchDept;
    });
  }, [positions, posSearch, selectedPos, selectedDept, user]);

  if (error) return <ErrorState message={error} />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        <button onClick={() => navigate('/reserve')} className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors mb-8">
          <ArrowLeft size={18}/>
          В резерв
        </button>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Briefcase size={24} />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Вакансии резерва</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-10">
          {/* ФИЛЬТР ДОЛЖНОСТЕЙ */}
          <div className={`${user?.role === 'hr' ? 'md:col-span-7' : 'md:col-span-12'} relative`} ref={posRef}>
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Поиск должности..."
              value={showPosList ? posSearch : (selectedPos || posSearch)}
              onFocus={() => { setShowPosList(true); setPosSearch(''); }}
              onChange={(e) => { setPosSearch(e.target.value); setSelectedPos(null); }}
              className="w-full pl-14 pr-12 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-slate-700 shadow-sm"
            />
            <ChevronDown className={`absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 transition-transform ${showPosList ? 'rotate-180' : ''}`} size={20} />
            {showPosList && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-2">
                <div onMouseDown={() => { setSelectedPos(null); setPosSearch(''); setShowPosList(false); }} className="px-5 py-3 hover:bg-slate-50 rounded-xl cursor-pointer text-[10px] font-black uppercase text-indigo-600">Все должности</div>
                {uniquePositions.filter(p => p.toLowerCase().includes(posSearch.toLowerCase())).map((pos, idx) => (
                  <div key={idx} onMouseDown={() => { setSelectedPos(pos); setPosSearch(pos); setShowPosList(false); }} className="px-5 py-4 hover:bg-indigo-50 rounded-xl cursor-pointer text-sm font-bold text-slate-600 flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedPos === pos ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                    {pos}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ФИЛЬТР ОТДЕЛОВ */}
          {['hr', 'director'].includes(user?.role || '') && (
            <div className="md:col-span-5 relative" ref={deptRef}>
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Отдел..."
                value={showDeptList ? deptSearch : (allDepartments.find(d => d.id === selectedDept)?.name || deptSearch)}
                onFocus={() => { setShowDeptList(true); setDeptSearch(''); }}
                onChange={(e) => { setDeptSearch(e.target.value); setSelectedDept(null); }}
                className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold text-slate-700 shadow-sm"
              />
              {showDeptList && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2">
                  <div onMouseDown={() => { setSelectedDept(null); setDeptSearch(''); setShowDeptList(false); }} className="px-5 py-3 hover:bg-slate-50 rounded-xl cursor-pointer text-[10px] font-black uppercase text-indigo-600">Все отделы</div>
                  {allDepartments.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase())).map(dept => (
                    <div key={dept.id} onMouseDown={() => { setSelectedDept(dept.id); setDeptSearch(dept.name); setShowDeptList(false); }} className="px-5 py-4 hover:bg-indigo-50 rounded-xl cursor-pointer text-sm font-bold text-slate-600">{dept.name}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {loading || authLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredPositions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPositions.map(pos => (
              <PositionCard key={pos.id} pos={pos} onClick={() => navigate(`/reserve/position/${pos.id}`)} />
            ))}
          </div>
        ) : (
          <EmptyState isFiltering={!!posSearch || !!selectedPos || !!selectedDept} />
        )}
      </div>
    </div>
  );
}

// Вспомогательные компоненты (Card, Skeleton, и т.д.) остались без изменений...
function PositionCard({ pos, onClick }: { pos: PositionWithCandidates, onClick: () => void }) {
  return (
    <div onClick={onClick} className="group relative bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-2xl transition-all cursor-pointer">
      <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider mb-4">
        {pos.department_name}
      </span>
      <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-8 group-hover:text-indigo-600 transition-colors">
        {pos.name}
      </h3>
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-4xl font-black text-slate-900 flex items-center gap-2">
            {pos.candidate_count} <Users className="text-indigo-500" size={24} />
          </span>
          <span className="text-xs font-medium text-slate-400 uppercase">Кандидатов</span>
        </div>
        {pos.avg_match > 0 && (
          <div className="text-right">
            <div className="text-emerald-600 font-bold text-2xl">{pos.avg_match}%</div>
            <div className="text-[10px] text-slate-400 uppercase">Матч</div>
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-[2rem] p-8 animate-pulse">
      <div className="h-4 w-24 bg-slate-100 rounded mb-4" />
      <div className="h-8 w-full bg-slate-100 rounded mb-10" />
      <div className="h-12 w-20 bg-slate-100 rounded" />
    </div>
  );
}

function EmptyState({ isFiltering }: { isFiltering: boolean }) {
  return (
    <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
      <h2 className="text-xl font-bold text-slate-900">Ничего не найдено</h2>
      <p className="text-slate-500 mt-2">{isFiltering ? 'Попробуйте изменить фильтры' : 'Список пока пуст'}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-20 text-rose-600 font-bold">{message}</div>
  );
}