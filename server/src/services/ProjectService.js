const { Project } = require('../models');
const logger = require('../utils/logger');

class ProjectService {
    async createProject(projectData) {
        try {
            return await Project.create(projectData);
        } catch (error) {
            logger.error('Create project error:', error);
            throw error;
        }
    }

    async getAllProjects(filters = {}) {
        try {
            const query = {};
            if (filters.status) query.status = filters.status;

            return await Project.find(query).sort({ start_date: -1 });
        } catch (error) {
            logger.error('Get all projects error:', error);
            throw error;
        }
    }

    async getProjectDetails(id) {
        try {
            const project = await Project.findById(id)
                .populate({
                    path: 'checkouts',
                    populate: { path: 'item_id', select: 'name' }
                });
            if (!project) throw new Error('Project not found');
            return project;
        } catch (error) {
            logger.error('Get project details error:', error);
            throw error;
        }
    }
}

module.exports = new ProjectService();
