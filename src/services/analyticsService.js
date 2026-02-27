import api from '../utils/api';

export const analyticsService = {
    getSummary: async () => {
        const response = await api.get('/analytics/summary');
        return response.data;
    },

    getLowStockAlerts: async () => {
        const response = await api.get('/analytics/low-stock-alerts');
        return response.data;
    },

    getTransferTime: async () => {
        const response = await api.get('/analytics/transfer-time');
        return response.data;
    },

    getMaintenanceCompliance: async () => {
        const response = await api.get('/analytics/maintenance-compliance');
        return response.data;
    }
};
