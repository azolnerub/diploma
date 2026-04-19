import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';

interface Department { id: number; name: string }
interface Position { id: number; name: string; department_id?: number }
interface Category { id: number; name: string }
interface Competency { id: number; name: string; description: string; category?: { id: number; name: string } }

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
  const [currentCompetencyId, setCurrentCompetencyId] = useState<number | ''>('');
  const [currentLevel, setCurrentLevel] = useState<number | ''>(60);
  const [currentWeight, setCurrentWeight] = useState(0.15);
  const [currentIsKey, setCurrentIsKey] = useState(false);

  const [positionProfiles, setPositionProfiles] = useState<PositionProfileItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Загрузка справочников
  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptRes, posRes, compRes, catRes] = await Promise.all([
          api.get('departments/'),
          api.get('positions/'),
          api.get('competencies/'),
          api.get('categories/')
        ]);

        setDepartments(deptRes.data);
        setPositions(posRes.data);
        setCompetencies(compRes.data);
        setCategories(catRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  // Загрузка текущего профиля должности при выборе должности
  useEffect(() => {
    if (!selectedPositionId) {
      setPositionProfiles([]);
      return;
    }

    const loadPositionProfile = async () => {
      try {
        const res = await api.get(`positions/${selectedPositionId}/profile/`);
        setPositionProfiles(res.data);
      } catch {
        setPositionProfiles([]);
      }
    };
    loadPositionProfile();
  }, [selectedPositionId]);

  const filteredPositions = useMemo(() => {
    if (!selectedDepartmentId) return positions;
    return positions.filter(p => p.department_id === Number(selectedDepartmentId));
  }, [positions, selectedDepartmentId]);

  const availableCompetencies = useMemo(() => {
    const usedIds = new Set(positionProfiles.map(p => p.competency));
    return competencies.filter(c => !usedIds.has(c.id));
  }, [competencies, positionProfiles]);

  const addCompetencyToPosition = async () => {
    if (!selectedPositionId || !currentCompetencyId) return;

    setSaving(true);
    setError('');

    try {
      await api.post(`positions/${selectedPositionId}/profile/`, {
        competency: currentCompetencyId,
        required_level: currentLevel,
        weight: currentWeight,
        is_key: currentIsKey
      });

      // Перезагружаем профиль
      const res = await api.get(`positions/${selectedPositionId}/profile/`);
      setPositionProfiles(res.data);

      setCurrentCompetencyId('');
      setCurrentLevel(60);
      setCurrentWeight(0.15);
      setCurrentIsKey(false);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 2000);
    } catch (err: unknown) {
       if (err && typeof err === 'object' && 'response' in err) {
         const axiosError = err as { response: { data?: { detail?: string } } };
         console.error(axiosError.response.data?.detail || 'Ошибка при добавлении');
       }
    } finally {
      setSaving(false);
    }
  };

  const removeCompetency = async (profileId: number) => {
    if (!confirm('Удалить компетенцию из профиля должности?')) return;

    try {
      await api.delete(`positions/${selectedPositionId}/profile/${profileId}/`);
      const res = await api.get(`positions/${selectedPositionId}/profile/`);
      setPositionProfiles(res.data);
    } catch {
      alert('Ошибка при удалении');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">Назначение компетенций должностям</h1>

      {/* Фильтры */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Отдел</label>
          <select 
            value={selectedDepartmentId} 
            onChange={e => setSelectedDepartmentId(e.target.value ? Number(e.target.value) : '')}
            className="w-full border border-slate-300 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Все отделы</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Должность</label>
          <select 
            value={selectedPositionId} 
            onChange={e => setSelectedPositionId(e.target.value ? Number(e.target.value) : '')}
            className="w-full border border-slate-300 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500"
            disabled={!selectedDepartmentId}
          >
            <option value="">Выберите должность</option>
            {filteredPositions.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedPositionId && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-2xl font-semibold mb-6">Профиль должности</h2>

          {/* Список уже добавленных компетенций */}
          <div className="mb-10">
            <h3 className="font-medium text-slate-700 mb-4">Добавленные компетенции</h3>
            {positionProfiles.length === 0 ? (
              <p className="text-slate-500 italic">Компетенции пока не добавлены</p>
            ) : (
              <div className="space-y-3">
                {positionProfiles.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-50 p-5 rounded-2xl">
                    <div>
                      <p className="font-medium">{item.competency_name}</p>
                      <p className="text-sm text-slate-500">
                        Уровень: <span className="font-semibold text-indigo-600">{item.required_level}%</span> • 
                        Вес: <span className="font-semibold">{item.weight}</span>
                        {item.is_key && <span className="ml-3 text-rose-600 text-xs font-bold">● Ключевая</span>}
                      </p>
                    </div>
                    <button 
                      onClick={() => removeCompetency(item.id!)}
                      className="text-rose-500 hover:text-rose-700 text-xl leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Форма добавления новой компетенции */}
          <div className="border-t pt-8">
            <h3 className="font-medium text-slate-700 mb-4">Добавить компетенцию в профиль должности</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-2">Компетенция</label>
                <select 
                  value={currentCompetencyId} 
                  onChange={e => setCurrentCompetencyId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border border-slate-300 rounded-2xl px-5 py-3"
                >
                  <option value="">Выберите компетенцию</option>
                  {availableCompetencies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Требуемый уровень владения</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={currentLevel}
                  onChange={e => {
                    const val =e.target.value;
                      setCurrentLevel(val === '' ? '' : Number(val));
                    }}
                  className="w-full border border-slate-300 rounded-2xl px-5 py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Вес</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  max="1" 
                  value={currentWeight}
                  onChange={e => setCurrentWeight(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-2xl px-5 py-3"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <input 
                type="checkbox" 
                id="is_key" 
                checked={currentIsKey}
                onChange={e => setCurrentIsKey(e.target.checked)}
              />
              <label htmlFor="is_key" className="text-sm text-slate-700">Ключевая компетенция (критично для должности)</label>
            </div>

            <button 
              onClick={addCompetencyToPosition}
              disabled={saving || !currentCompetencyId}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold py-4 rounded-2xl transition"
            >
              {saving ? 'Сохранение...' : 'Добавить компетенцию в профиль должности'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
