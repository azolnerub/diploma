import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AxiosError } from 'axios';
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({ 
  label, 
  value, 
  onChange, 
  show, 
  toggle 
}: { 
  label: string, 
  value: string, 
  onChange: (val: string) => void, 
  show: boolean, 
  toggle: () => void 
}) => (
  <div className="relative">
    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
      {label}
    </label>
    <div className="relative">
      <input 
        type={show ? "text" : "password"} 
        required 
        value={value}
        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
        onChange={e => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  </div>
);

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ current: '', new: '', confirm: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('change-password/', {
        current_password: form.current,
        new_password: form.new,
        confirm_password: form.confirm
      });
      setStatus({ type: 'success', msg: 'Пароль успешно обновлен!' });
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      setStatus({ 
        type: 'error', 
        msg: axiosError.response?.data?.error || 'Ошибка при смене пароля' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200 border border-slate-100">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 mb-6 transition-colors font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Назад
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <KeyRound size={24}/>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Смена пароля</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordInput 
            label="Текущий пароль"
            value={form.current}
            onChange={(val) => setForm({...form, current: val})}
            show={showCurrent}
            toggle={() => setShowCurrent(!showCurrent)}
          />

          <PasswordInput 
            label="Новый пароль"
            value={form.new}
            onChange={(val) => setForm({...form, new: val})}
            show={showNew}
            toggle={() => setShowNew(!showNew)}
          />

          <PasswordInput 
            label="Повторите новый пароль"
            value={form.confirm}
            onChange={(val) => setForm({...form, confirm: val})}
            show={showConfirm}
            toggle={() => setShowConfirm(!showConfirm)}
          />

          {status && (
            <div className={`flex items-center gap-2 p-4 rounded-2xl text-sm font-bold ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {status.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
              {status.msg}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-wider text-sm"
          >
            Обновить пароль
          </button>
        </form>
      </div>
    </div>
  );
}