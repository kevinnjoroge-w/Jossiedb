import api from '../utils/api';

export const analyticsService = {
    getSummary: async () => {
        const response = await api.get('/analytics/summary');
        return response.data;
    },

    getLowStockAlerts: async () => {
        const response = await api.get('/analytics/low-stock-alerts');
        return response.data;
    }
};
