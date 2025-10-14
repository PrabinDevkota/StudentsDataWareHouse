const express = require('express');
const skillsController = require('../controllers/skills.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', skillsController.getSkills);
router.get('/search', skillsController.searchSkills);

// Protected routes
router.use(authenticateToken);

// Admin only routes
router.post('/', requireAdmin, skillsController.createSkill);
router.put('/:id', requireAdmin, skillsController.updateSkill);
router.delete('/:id', requireAdmin, skillsController.deleteSkill);

module.exports = router;
