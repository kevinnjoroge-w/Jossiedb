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

    async getAllProjects(user, filters = {}) {
        try {
            const query = {};
            if (filters.status) query.status = filters.status;

            // Restrict projects based on user role and assigned locations
            if (user.role !== 'admin' && user.role !== 'supervisor') {
                const { UserLocations } = require('../models');
                const userLocations = await UserLocations.find({ user_id: user.id });
                const locationIds = userLocations.map(ul => ul.location_id);

                // Note: project.location is currently a string in the model. 
                // However, users are assigned to Location IDs.
                // If project.location is intended to be a Location Name or ID, 
                // we should filter accordingly.
                // Assuming project.location should match the name of the assigned locations
                // or if the model intended to use IDs, we'd use location_id.
                // Based on UserLocation model, it uses location_id.
                // Let's check Location names if project.location stores names.

                const { Location } = require('../models');
                const locations = await Location.find({ _id: { $in: locationIds } });
                const locationNames = locations.map(l => l.name);

                query.location = { $in: locationNames };
            }

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
