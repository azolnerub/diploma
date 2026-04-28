import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор запроса
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  } 
  return config;
}, (error) => Promise.reject(error));

// Интерцептор ответа
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если 401 ошибка, не повтор, не запрос к эндпоинтам токенов
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('token/')) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}token/refresh/`, {
            refresh: refreshToken,
          });

          const { access, refresh } = res.data;
          
          // сохраняем access-токен
          if (access) {
            localStorage.setItem('access_token', access);

            // обновляем заголовок в упавшем запросе
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access}`;
            }
          }
          // обновляем refresh-токен, если сервер прислал новый
          if (refresh) localStorage.setItem('refresh_token', refresh);
          
          return api(originalRequest);
        } catch (refreshError) {
          console.error('[Axios] Сессия истекла');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
