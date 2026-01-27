const { Project, CheckOut, Item } = require('../models');
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
            const where = {};
            if (filters.status) where.status = filters.status;

            return await Project.findAll({
                where,
                order: [['start_date', 'DESC']]
            });
        } catch (error) {
            throw error;
        }
    }

    async getProjectDetails(id) {
        try {
            const project = await Project.findByPk(id, {
                include: [
                    {
                        model: CheckOut,
                        include: [{ model: Item, attributes: ['name'] }]
                    }
                ]
            });
            if (!project) throw new Error('Project not found');
            return project;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ProjectService();
