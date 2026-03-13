import api from "./api";

const authService = {
    // Вход в систему 
    login: async (username, password) => {
                const response = await api.post('/users/users/login/', {username, password});

                if (response.data.token) {
                    localStorage.setItem('access_token', response.data.token);
                    localStorage.setItem('user_role', response.data.user.role);
                    localStorage.setItem('username', response.data.user.username);
                }
                return response.data;
},
// Регистрация
register: async (userData) => {
    const response = await api.post('users/users/register/', userData);
    return response.data;
},

// Выход
logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
},

// Получение информации о текущем пользователе
getCurrentUser: async () => {
    const response = await api.get('users/users/me/');
    return response.data;
},

// Проверка - авторизован ли пользователь
isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
},

// Получение роли пользователя
getUserRole: () => {
    return localStorage.getItem('user_role');
}
};

export default authService;