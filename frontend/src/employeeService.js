import api from "./api";

const employeeService = {
    // Получить всех сотрудников
    getAll: async (params = {}) => {
        const response = await api.get('/employees/employees/', {params});
        return response.data;
    },
    
    // Получить сотрудника по ID
    getById: async(id) => {
        const response = await api.get(`/employees/employees/${id}/`);
        return response.data;
    },

    // Создать сотрудника
    create: async (employeeData) => {
        const response = await api.post('/employees/employees', employeeData);
        return response.data;
    },

    // Обновить сотрудника
    update: async (id, employeeData) => {
        const response = await api.put(`/employees/employees/${id}/`, employeeData);
        return response.data;
    },

    // Удалить сотрудника
    delete: async(id) => {
        const response = await api.delete(`/employees/employees/${id}/`);
        return response.data;
    },

    // Получить отделы
    getDepartment: async() => {
        const response = await api.get('/employees/departments/');
        return response.data;
    },

    // Получить должности
    getPositions: async(departmentId = null) => {
        const params = departmentId ? {department: departmentId} : {};
        const response = await api.get('/employees/positions/', {params});
        return response.data; 
    }
};

export default employeeService;