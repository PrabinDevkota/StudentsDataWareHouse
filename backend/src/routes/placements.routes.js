const express = require('express');
const placementsController = require('../controllers/placements.controller');
const { authenticateToken, requireCIROrAdmin } = require('../middleware/auth.middleware');
const { validatePlacementCreate, validatePlacementStatusUpdate } = require('../middleware/validate.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// CIR/Admin routes
router.get('/', requireCIROrAdmin, placementsController.getPlacements);
router.get('/:id', requireCIROrAdmin, placementsController.getPlacementById);
router.post('/', requireCIROrAdmin, validatePlacementCreate, placementsController.createPlacement);
router.put('/:id/status', requireCIROrAdmin, validatePlacementStatusUpdate, placementsController.updatePlacementStatus);
router.get('/stats/summary', requireCIROrAdmin, placementsController.getPlacementStats);

module.exports = router;
