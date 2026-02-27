import api from '../utils/api';

export const maintenanceService = {
    getAll: async (filters = {}) => {
        const response = await api.get('/maintenance', { params: filters });
        return response.data;
    },

    schedule: async (data) => {
        const response = await api.post('/maintenance', data);
        return response.data;
    },

    updateStatus: async (id, payload) => {
        const response = await api.put(`/maintenance/${id}/status`, payload);
        return response.data;
    },

    delete: async (id) => {
        await api.delete(`/maintenance/${id}`);
    }
};
