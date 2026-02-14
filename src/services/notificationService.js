import api from '../utils/api';

export const notificationService = {
    getAll: async (params = {}) => {
        const response = await api.get('/notifications', { params });
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data.count;
    },

    markAsRead: async (id) => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await api.post('/notifications/mark-all-read');
        return response.data;
    },

    delete: async (id) => {
        await api.delete(`/notifications/${id}`);
    }
};
