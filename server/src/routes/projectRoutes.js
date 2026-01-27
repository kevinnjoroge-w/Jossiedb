const express = require('express');
const router = express.Router();
const ProjectService = require('../services/ProjectService');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', async (req, res, next) => {
    try {
        const projects = await ProjectService.getAllProjects(req.query);
        res.json(projects);
    } catch (err) {
        next(err);
    }
});

router.post('/', authorize(['admin', 'supervisor']), async (req, res, next) => {
    try {
        const project = await ProjectService.createProject(req.body);
        res.status(201).json(project);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const project = await ProjectService.getProjectDetails(req.params.id);
        res.json(project);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

module.exports = router;
