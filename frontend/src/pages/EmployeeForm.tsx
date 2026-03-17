import { useState, useEffect } from 'react';
import api from '../api/axios';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

interface Department { id: number; name: string }
interface Position { id: number; name: string }

interface EmployeeFormState {
  full_name: string;
  username: string;
  position_id: string | number;
  department_id: string | number;
  hire_date: string;
  status: string;
}

export default function EmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState<EmployeeFormState>({
    full_name: '',
    username: '',
    position_id: '',
    department_id: '',
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


  // Загрузка данных при редактировании
  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptRes, posRes] = await Promise.all([
          api.get('departments/'),
          api.get('positions/'),
        ]);
        setDepartments(deptRes.data);
        setPositions(posRes.data);

        if (isEdit && id) {
          const empRes = await api.get(`employees/${id}/`);
          const data = empRes.data;
          setForm({
            full_name: data.full_name,
            username: data.username || '',
            position_id: data.position || '',
            department_id: data.department || '',
            hire_date: data.hire_date,
            status: data.status,
          });

          setDeptSearch(data.department_name || ''); 
          setPosSearch(data.position_name || '');
        }
      } catch {
        setError('Не удалось загрузить справочники или данные сотрудника');
      }
    };
    loadData();
  }, [id, isEdit]);


const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Проверка, что ID выбраны, а не просто введен текст
    if (!form.department_id || !form.position_id) {
      setError('Пожалуйста, выберите отдел и должность из списка');
      setLoading(false);
      return;
    }
    try {
      const payload = {
        ...form,
        position_id: Number(form.position_id),
        department_id: Number(form.department_id),
      };

      if (isEdit) {
        await api.put(`employees/${id}/update/`, payload);
      } else {
        await api.post('employees/create/', payload);
      }

      setSuccess(true);
      setTimeout(() => navigate('/hr'), 1500);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Ошибка сохранения');
      } else {
        setError('Произошла ошибка');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">
        {isEdit ? 'Редактирование сотрудника' : 'Добавление сотрудника'}
      </h2>

      {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">Успешно!</div>}
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
          <input
            type="text"
            value={form.full_name}
            onChange={e => setForm({...form, full_name: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
        </div>

        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Логин (username)</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Отдел</label>
            <input
              type="text"
              placeholder="Введите название..."
              value={deptSearch}
              onChange={e => {
                setDeptSearch(e.target.value);
                setForm({...form, department_id: ''}); 
                setShowDeptList(true);
              }}
              onFocus={() => setShowDeptList(true)}
              onBlur={() => setTimeout(() => setShowDeptList(false), 200)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            {showDeptList && (
              <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {departments
                  .filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase()))
                  .map(d => (
                    <div
                      key={d.id}
                      onClick={() => {
                        setForm({...form, department_id: d.id});
                        setDeptSearch(d.name);
                        setShowDeptList(false);
                      }}
                      className="px-4 py-2 hover:bg-indigo-50 cursor-pointer"
                    >
                      {d.name}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Должность</label>
            <input
              type="text"
              placeholder="Введите название..."
              value={posSearch}
              onChange={e => {
                setPosSearch(e.target.value);
                setForm({...form, position_id: ''});
                setShowPosList(true);
              }}
              onFocus={() => setShowPosList(true)}
              onBlur={() => setTimeout(() => setShowPosList(false), 200)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            {showPosList && (
              <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {positions
                  .filter(p => p.name.toLowerCase().includes(posSearch.toLowerCase()))
                  .map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setForm({...form, position_id: p.id});
                        setPosSearch(p.name);
                        setShowPosList(false);
                      }}
                      className="px-4 py-2 hover:bg-indigo-50 cursor-pointer"
                    >
                      {p.name}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Дата приёма</label>
          <input
            type="date"
            value={form.hire_date}
            onChange={e => setForm({...form, hire_date: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
          <select
            value={form.status}
            onChange={e => setForm({...form, status: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="Работает">Работает</option>
            <option value="В отпуске">В отпуске</option>
            <option value="Уволен">Уволен</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl transition disabled:opacity-60"
        >
          {loading ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Создать сотрудника'}
        </button>
      </form>
    </div>
  );
}