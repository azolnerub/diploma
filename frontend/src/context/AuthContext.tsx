import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function tryRefreshToken(): Promise<boolean> {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return false;
  try {
    const res = await api.post<{ access: string }>('token/refresh/', { refresh });
    localStorage.setItem('access_token', res.data.access);
    return true;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<User>('me/');
      setUser(res.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          try {
            const res = await api.get<User>('me/');
            setUser(res.data);
            return;
          } catch {
            // после обновления токена /me/ всё равно упал
          }
        }
      }
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Запускается один раз при монтировании
  useEffect(() => {
    fetchUser();

    // Для синхронизации между вкладками
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        fetchUser();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUser]);

  // Вызывается со страницы логина после успешной авторизации
  const login = useCallback(async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };