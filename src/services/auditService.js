import api from '../utils/api';

export const auditService = {
    getLogs: async (params = {}) => {
        const response = await api.get('/audit', { params });
        return response.data;
    }
};
