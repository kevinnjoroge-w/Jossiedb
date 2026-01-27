import api from '../utils/api';

export const userService = {
    getAllUsers: async () => {
        const response = await api.get('/users');
        return response.data;
    },

    createUser: async (userData) => {
        const response = await api.post('/users', userData);
        return response.data;
    },

    updateUser: async (id, userData) => {
        const response = await api.put(`/users/${id}`, userData);
        return response.data;
    },

    deleteUser: async (id) => {
        await api.delete(`/users/${id}`);
    },
};
