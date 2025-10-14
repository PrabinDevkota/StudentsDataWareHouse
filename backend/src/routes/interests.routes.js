const express = require('express');
const interestsController = require('../controllers/interests.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', interestsController.getInterests);
router.get('/search', interestsController.searchInterests);

// Protected routes
router.use(authenticateToken);

// Admin only routes
router.post('/', requireAdmin, interestsController.createInterest);
router.put('/:id', requireAdmin, interestsController.updateInterest);
router.delete('/:id', requireAdmin, interestsController.deleteInterest);

module.exports = router;
