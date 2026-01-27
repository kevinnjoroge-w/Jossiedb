import api from '../utils/api';

export const projectService = {
    getAllProjects: async (params = {}) => {
        const response = await api.get('/projects', { params });
        return response.data;
    },

    getProjectById: async (id) => {
        const response = await api.get(`/projects/${id}`);
        return response.data;
    },

    createProject: async (data) => {
        const response = await api.post('/projects', data);
        return response.data;
    }
};
