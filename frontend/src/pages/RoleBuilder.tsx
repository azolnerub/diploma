import { useState, useEffect } from 'react';
import api from '../api/axios';

interface Department { id: number; name: string }
interface Competency { id: number; name: string; category: { id: number; name: string } | number }

interface Role {
  id: number;
  name: string;
  description: string;
  department: number;
}

interface DraftItem {
  competency: number;
  competency_name: string;
  required_level: number;
  weight: number;
}

export default function RoleBuilder() {

  const [departments, setDepartments] = useState<Department[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [defaultMissingLevel, setDefaultMissingLevel] = useState(20);

  const [draft, setDraft] = useState<DraftItem[]>([]);

  const [loading, setLoading] = useState(false);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptRes, compRes, roleRes] = await Promise.all([
          api.get<Department[]>('departments/'),
          api.get<Competency[]>('competencies/'),
          api.get<Role[]>('roles/')
        ]);
        setDepartments(deptRes.data);
        setCompetencies(compRes.data);
        setRoles(roleRes.data);
      } catch (err) {
        console.error("Ошибка загрузки:", err);
      }
    };
    loadData();
  }, []);

  const addToDraft = (comp: Competency) => {
    if (draft.some(item => item.competency === comp.id)) return;
    setDraft([...draft, {
      competency: comp.id,
      competency_name: comp.name,
      required_level: 60,
      weight: 0.15
    }]);
  };

  const removeFromDraft = (index: number) => {
    setDraft(draft.filter((_, i) => i !== index));
  };

  const updateDraftItem = (index: number, field: keyof DraftItem, value: number) => {
    const newDraft = [...draft];
    newDraft[index] = { ...newDraft[index], [field]: value };
    setDraft(newDraft);
  };

  const totalWeight = draft.reduce((sum, item) => sum + item.weight, 0);

  const saveRole = async () => {
    if (!roleName || !selectedDeptId || draft.length === 0) {
      alert("Заполните название роли, отдел и добавьте хотя бы одну компетенцию");
      return;
    }
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      alert(`Сумма весов должна быть близка к 1.0 (сейчас ${totalWeight.toFixed(2)})`);
      return;
    }

    setLoading(true);
    try {
      const roleRes = await api.post<Role>('roles/', {
        name: roleName,
        description: roleDescription,
        department: selectedDeptId,
        default_missing_level: defaultMissingLevel
      });

      const roleId = roleRes.data.id;

      // Создаём профиль роли
      for (const item of draft) {
        await api.post(`roles/${roleId}/profile/`, {
          competency: item.competency,
          required_level: item.required_level,
          weight: item.weight
        });
      }
      alert("Роль успешно создана!");
      setRoleName('');
      setRoleDescription('');
      setDraft([]);

      const res = await api.get<Role[]>('roles/');
      setRoles(res.data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response: { data?: { detail?: string } } };
        alert("Ошибка: " + (axiosError.response.data?.detail || "Неизвестная ошибка"));
      } else {
        alert("Ошибка при сохранении");
      }
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Конструктор ролей</h1>

      {/* Форма создания роли */}
      <div className="bg-white rounded-3xl shadow p-8 mb-10">
        <h2 className="text-2xl font-semibold mb-6">Создать новую роль</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Название роли</label>
            <input
              type="text"
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              className="w-full border border-slate-300 rounded-2xl px-5 py-3"
              placeholder="Например: Senior Frontend Developer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Отдел</label>
            <select
              value={selectedDeptId}
              onChange={e => setSelectedDeptId(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-2xl px-5 py-3"
            >
              <option value="">Выберите отдел</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">Описание роли</label>
          <textarea
            value={roleDescription}
            onChange={e => setRoleDescription(e.target.value)}
            className="w-full border border-slate-300 rounded-2xl px-5 py-3 h-24"
            placeholder="Ключевые задачи и ожидания от роли..."
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">
            Уровень по умолчанию при отсутствии оценки (0-100)
          </label>
          <input
            type="number"
            value={defaultMissingLevel}
            onChange={e => setDefaultMissingLevel(Number(e.target.value))}
            min={0}
            max={100}
            className="w-32 border border-slate-300 rounded-2xl px-5 py-3"
          />
        </div>

        {/* Список компетенций для добавления */}
        <div className="mt-10">
          <h3 className="font-semibold mb-4">Добавьте компетенции в роль</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-4 border border-slate-200 rounded-2xl">
            {competencies.map(comp => (
              <button
                key={comp.id}
                onClick={() => addToDraft(comp)}
                className="text-left p-4 bg-slate-50 hover:bg-indigo-50 rounded-2xl transition text-sm"
              >
                {comp.name}
              </button>
            ))}
          </div>
        </div>

        {/* Черновик роли */}
        {draft.length > 0 && (
          <div className="mt-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Черновик роли ({draft.length} компетенций)</h3>
              <div className="text-sm font-medium">
                Сумма весов: <span className={Math.abs(totalWeight - 1) < 0.02 ? "text-emerald-600" : "text-rose-600"}>
                  {totalWeight.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {draft.map((item, index) => (
                <div key={index} className="flex gap-4 items-center bg-white border border-slate-200 p-5 rounded-2xl">
                  <div className="flex-1">
                    <p className="font-medium">{item.competency_name}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <label className="text-xs text-slate-500">Требуемый уровень</label>
                      <input
                        type="number"
                        value={item.required_level}
                        onChange={e => updateDraftItem(index, 'required_level', Number(e.target.value))}
                        className="w-20 border rounded-xl px-3 py-1 text-center"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Вес</label>
                      <input
                        type="number"
                        step="0.05"
                        value={item.weight}
                        onChange={e => updateDraftItem(index, 'weight', Number(e.target.value))}
                        className="w-20 border rounded-xl px-3 py-1 text-center"
                      />
                    </div>
                  </div>
                  <button onClick={() => removeFromDraft(index)} className="text-rose-500 hover:text-rose-700">×</button>
                </div>
              ))}
            </div>

            <button
              onClick={saveRole}
              disabled={loading || Math.abs(totalWeight - 1) > 0.05}
              className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold py-4 rounded-2xl transition"
            >
              {loading ? "Сохранение..." : "Создать роль"}
            </button>
          </div>
        )}
      </div>

      {/* Список существующих ролей */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Существующие роли</h2>
        <div className="grid gap-4">
          {roles.map(role => (
            <div key={role.id} className="bg-white p-6 rounded-3xl border">
              <h3 className="font-bold text-lg">{role.name}</h3>
              <p className="text-slate-600 text-sm mt-1">{role.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
