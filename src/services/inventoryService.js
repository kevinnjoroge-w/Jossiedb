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
    },

    createLocation: async (locationData) => {
        const response = await api.post('/locations', locationData);
        return response.data;
    },

    updateLocation: async (id, locationData) => {
        const response = await api.put(`/locations/${id}`, locationData);
        return response.data;
    },

    deleteLocation: async (id) => {
        await api.delete(`/locations/${id}`);
    },

    assignForeman: async (locationId, userId) => {
        const response = await api.post(`/locations/${locationId}/foremen`, { userId });
        return response.data;
    },

    unassignForeman: async (locationId, userId) => {
        const response = await api.delete(`/locations/${locationId}/foremen/${userId}`);
        return response.data;
    },

    updateItemLocation: async (itemId, locationData) => {
        const response = await api.put(`/items/${itemId}/location`, locationData);
        return response.data;
    },

    getItemLocationSummary: async (itemId) => {
        const response = await api.get(`/items/${itemId}/location-summary`);
        return response.data;
    },

    getLocationHistory: async (itemId) => {
        const response = await api.get(`/items/${itemId}/location-history`);
        return response.data;
    }
};
