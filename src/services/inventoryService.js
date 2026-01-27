import api from '../utils/api';

export const inventoryService = {
    getAllItems: async (params = {}) => {
        const response = await api.get('/items', { params });
        return response.data;
    },

    getItemById: async (id) => {
        const response = await api.get(`/items/${id}`);
        return response.data;
    },

    createItem: async (itemData) => {
        const response = await api.post('/items', itemData);
        return response.data;
    },

    updateItem: async (id, itemData) => {
        const response = await api.put(`/items/${id}`, itemData);
        return response.data;
    },

    deleteItem: async (id) => {
        await api.delete(`/items/${id}`);
    },

    getLocations: async () => {
        const response = await api.get('/locations');
        return response.data;
    }
};
