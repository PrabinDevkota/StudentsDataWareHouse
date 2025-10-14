const express = require('express');
const researchController = require('../controllers/research.controller');
const { authenticateToken, requireFacultyOrAdmin, requireAdmin } = require('../middleware/auth.middleware');
const { validateResearchProjectCreate, validateResearchProjectParticipant } = require('../middleware/validate.middleware');

const router = express.Router();

// Public routes
router.get('/projects', researchController.getResearchProjects);
router.get('/projects/:id', researchController.getResearchProjectById);

// Protected routes
router.use(authenticateToken);

// Faculty/Admin routes
router.post('/projects', requireFacultyOrAdmin, validateResearchProjectCreate, researchController.createResearchProject);
router.put('/projects/:id', requireFacultyOrAdmin, researchController.updateResearchProject);
router.post('/projects/:id/participants', requireFacultyOrAdmin, validateResearchProjectParticipant, researchController.addParticipant);
router.delete('/projects/:id/participants/:student_id', requireFacultyOrAdmin, researchController.removeParticipant);

// Admin only routes
router.delete('/projects/:id', requireAdmin, researchController.deleteResearchProject);

module.exports = router;
