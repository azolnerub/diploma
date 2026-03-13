import api from './api';

const competencyService = {
    // Получить все компетенции
    getAll: async(params = {}) => {
        const response = await api.get('/competencies/competencies/', {params});
        return response.data;
    },

    // Получить категории компетенций
    getCategories: async() => {
        const response = await api.get('competencies/categories/');
        return response.data;
    },

    // Создать компетенцию
    create: async (data) => {
        const response = await api.post('/competencies/competencies/', data);
        return response.data;
    },

    // Обновить компетенцию
    update: async(id, data) => {
        const response = await api.put(`/competencies/competencies/${id}/`, data);
        return response.data;
    },

    // Удалить компетенцию
    delete: async (id) => {
        const response = await api.delete(`/competencies/competencies/${id}/`);
        return response.data;
    },

    // Получить компетенции категории
    getByCategory: async(categoryId) => {
        const response = await api.get(`/competencies/categories/${categoryId}/competencies/`);
        return response.data;
    }
};

export default competencyService;