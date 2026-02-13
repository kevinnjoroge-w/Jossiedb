import api from '../utils/api';

export const transferService = {
    getAllTransfers: async (params = {}) => {
        const response = await api.get('/transfers', { params });
        return response.data;
    },

    getTransferById: async (id) => {
        const response = await api.get(`/transfers/${id}`);
        return response.data;
    },

    createTransferRequest: async (transferData) => {
        const response = await api.post('/transfers', transferData);
        return response.data;
    },

    approveTransfer: async (id) => {
        const response = await api.post(`/transfers/${id}/approve`);
        return response.data;
    },

    rejectTransfer: async (id, reason) => {
        const response = await api.post(`/transfers/${id}/reject`, { reason });
        return response.data;
    },

    completeTransfer: async (id) => {
        const response = await api.post(`/transfers/${id}/complete`);
        return response.data;
    }
};
