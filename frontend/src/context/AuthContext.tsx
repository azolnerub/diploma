import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import axios from 'axios';
import api from '../api/axios';

interface User {
  id: number;
  username: string;
  role: 'hr' | 'manager' | 'employee' | 'director';
  full_name: string;
  position?: string | null;
  department?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    let accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    // если нет вообще никаких токенов - выход
    if (!accessToken && !refreshToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    // ПРОАКТИВНЫЙ РЕФРЕШ
    // если access_token пропал, но есть refresh_token - пробуем восстановиться
    if (!accessToken && refreshToken) {
      try {
        const res = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
          refresh: refreshToken,
        });
        accessToken = res.data.access;

        if (accessToken) localStorage.setItem('access_token', accessToken); 

        if (res.data.refresh) localStorage.setItem('refresh_token', res.data.refresh);
      } catch {
        // если даже рефреш не помог - выход
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setLoading(false);
        return;
      }
    }
    
    // загружаем данные пользователя
    try {
      const res = await api.get<User>('me/');
      setUser(res.data);
    } catch {
      console.error('[AuthContext] Не удалось загрузить пользователя');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'refresh_token') fetchUser();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUser]);

  const login = useCallback(async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    
    if (refreshToken) {
      try {
        await api.post('token/logout/', { refresh: refreshToken });
      } catch (err) {
        console.warn('[AuthContext] Logout на сервере не удался', err);
      }
    }
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
