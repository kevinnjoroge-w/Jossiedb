import api from '../utils/api';

export const transactionService = {
    getCheckouts: async (params = {}) => {
        const response = await api.get('/checkouts', { params });
        return response.data;
    },

    checkoutItem: async (data) => {
        const response = await api.post('/checkouts/checkout', data);
        return response.data;
    },

    checkinItem: async (id, data) => {
        const response = await api.post(`/checkouts/${id}/checkin`, data);
        return response.data;
    },

    authorizeCheckout: async (id) => {
        const response = await api.post(`/checkouts/${id}/authorize`);
        return response.data;
    }
};
