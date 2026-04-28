import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, User, LogIn, ShieldCheck, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('token/', { username, password });
      const { access, refresh } = response.data;
      await login(access, refresh);
      navigate('/profile', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const serverError = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0];
        setError(serverError || 'Неверный логин или пароль');
      } else {
        setError('Ошибка соединения с сервером');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[100px]" />
        
        <div className="relative z-10 max-w-lg text-center lg:text-left">
          <div className="flex items-center gap-3 mb-8 justify-center lg:justify-start group cursor-default">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 transition-all duration-500 group-hover:rotate-[360deg] group-hover:scale-110">
              <ShieldCheck size={28} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">HR-Portal</span>
          </div>
          
          <h2 className="text-5xl font-black text-white leading-tight mb-6">
            Управляйте талантами на основе данных
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium">
            Автоматизированная платформа для оценки компетенций и анализа динамики развития вашей команды
          </p>
        </div>
      </div>

      {/* Форма авторизации*/}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-slate-50 lg:bg-white transition-colors duration-500">
        <div className="w-full max-w-[440px]">
          
          <header className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Добро пожаловать!</h1>
            <p className="text-slate-500 font-medium">Пожалуйста, введите данные для входа</p>
          </header>

          {error && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Логин */}
            <div className="group space-y-2">
              <label htmlFor="username" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 cursor-pointer transition-colors group-focus-within:text-indigo-600">
                Логин
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 group-focus-within:scale-110 transition-all duration-300">
                  <User size={20} />
                </div>
                <input
                  id="username" 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all duration-300 font-medium text-slate-900 placeholder:text-slate-300"
                  autoComplete="username"
                  required 
                />
              </div>
            </div>

            {/* Пароль */}
            <div className="group space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label htmlFor="password" className="text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer transition-colors group-focus-within:text-indigo-600">
                  Пароль
                </label>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 group-focus-within:scale-110 transition-all duration-300">
                  <Lock size={20} />
                </div>
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full pl-12 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all duration-300 font-medium text-slate-900 placeholder:text-slate-300"
                  autoComplete="current-password"
                  required 
                />
               <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Кнопка входа */}
            <button 
              type="submit" 
              disabled={isLoading}
              className={`
                w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all duration-300 shadow-lg active:scale-[0.97]
                ${isLoading 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-400/40 hover:-translate-y-0.5'
                }
              `}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <LogIn size={20} className="transition-transform group-hover:translate-x-1" />
                  Войти в систему
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}