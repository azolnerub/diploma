import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// === INTERCEPTOR ЗАПРОСА (добавляет токен) ===
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`[Axios] Токен добавлен → ${config.url}`);
  } else {
    console.log(`[Axios] Токен НЕ найден для ${config.url}`);
  }
  return config;
});

// === INTERCEPTOR ОТВЕТА (обрабатывает 401) ===
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('[Axios] 401 → разлогиниваем');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;