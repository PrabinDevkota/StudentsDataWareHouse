const placementsModel = require('../models/placements.model');
const { asyncHandler } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

// Get all placements
const getPlacements = asyncHandler(async (req, res) => {
  const filters = req.query;
  const { page = 1, limit = 20 } = filters;

  try {
    const [placements, total] = await Promise.all([
      placementsModel.findAllWithDetails(filters),
      placementsModel.countByFilters(filters)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        placements,
        meta: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get placements failed:', { filters, error: error.message });
    throw error;
  }
});

// Get placement by ID
const getPlacementById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const placement = await placementsModel.getByIdWithDetails(id);
    
    if (!placement) {
      return res.status(404).json({
        success: false,
        error: 'Placement not found',
        code: 'PLACEMENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: placement
    });
  } catch (error) {
    logger.error('Get placement by ID failed:', { id, error: error.message });
    throw error;
  }
});

// Create new placement
const createPlacement = asyncHandler(async (req, res) => {
  const placementData = req.body;

  // Ensure required fields have sensible defaults
  if (!placementData.applied_date) {
    // Set applied_date to today if not provided
    placementData.applied_date = new Date().toISOString().slice(0, 10);
  }
  if (!placementData.status) {
    placementData.status = 'APPLIED';
  }

  try {
    const placement = await placementsModel.create(placementData);
    
    logger.info('Placement created successfully', { 
      placement_id: placement.placement_id,
      student_id: placement.student_id,
      company_id: placement.company_id,
      job_role_id: placement.job_role_id,
      status: placement.status,
      offer_type: placement.offer_type
    });

    res.status(201).json({
      success: true,
      message: 'Placement created successfully',
      data: placement
    });
  } catch (error) {
    logger.error('Create placement failed:', { placementData, error: error.message });
    throw error;
  }
});

// Update placement status
const updatePlacementStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, accepted_date, offer_type, offered_date } = req.body;

  try {
    const updatedPlacement = await placementsModel.updateStatus(
      id,
      status,
      accepted_date,
      offer_type,
      offered_date
    );
    
    if (!updatedPlacement) {
      return res.status(404).json({
        success: false,
        error: 'Placement not found',
        code: 'PLACEMENT_NOT_FOUND'
      });
    }

    logger.info('Placement status updated successfully', { 
      placement_id: id,
      status,
      offer_type
    });

    res.json({
      success: true,
      message: 'Placement status updated successfully',
      data: updatedPlacement
    });
  } catch (error) {
    logger.error('Update placement status failed:', { id, status, error: error.message });
    throw error;
  }
});

// Get placement statistics
const getPlacementStats = asyncHandler(async (req, res) => {
  try {
    const stats = await placementsModel.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get placement stats failed:', { error: error.message });
    throw error;
  }
});

module.exports = {
  getPlacements,
  getPlacementById,
  createPlacement,
  updatePlacementStatus,
  getPlacementStats
};
