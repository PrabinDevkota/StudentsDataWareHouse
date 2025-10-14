const interestsModel = require('../models/interests.model');
const { asyncHandler } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

// Get all interests
const getInterests = asyncHandler(async (req, res) => {
  try {
    const interests = await interestsModel.findAllWithStats();
    
    res.json({
      success: true,
      data: interests
    });
  } catch (error) {
    logger.error('Get interests failed:', { error: error.message });
    throw error;
  }
});

// Search interests
const searchInterests = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required',
      code: 'MISSING_QUERY'
    });
  }

  try {
    const interests = await interestsModel.searchByName(q);
    
    res.json({
      success: true,
      data: interests
    });
  } catch (error) {
    logger.error('Search interests failed:', { query: q, error: error.message });
    throw error;
  }
});

// Create new interest
const createInterest = asyncHandler(async (req, res) => {
  const { name, category } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Interest name is required',
      code: 'MISSING_INTEREST_NAME'
    });
  }

  try {
    // Check if interest already exists
    const existingInterest = await interestsModel.findByName(name);
    if (existingInterest) {
      return res.status(409).json({
        success: false,
        error: 'Interest already exists',
        code: 'DUPLICATE_INTEREST'
      });
    }

    const interest = await interestsModel.create({
      name: name.trim(),
      category: category ? String(category).trim() : null
    });
    
    logger.info('Interest created successfully', { 
      interest_id: interest.interest_id,
      name: interest.name
    });

    res.status(201).json({
      success: true,
      message: 'Interest created successfully',
      data: interest
    });
  } catch (error) {
    logger.error('Create interest failed:', { interestData, error: error.message });
    throw error;
  }
});

// Update interest
const updateInterest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = String(name).trim();
  if (category !== undefined) updateData.category = String(category).trim();

  try {
    const updatedInterest = Object.keys(updateData).length > 0
      ? await interestsModel.update(id, updateData)
      : await interestsModel.findById(id);
    
    if (!updatedInterest) {
      return res.status(404).json({
        success: false,
        error: 'Interest not found',
        code: 'INTEREST_NOT_FOUND'
      });
    }

    logger.info('Interest updated successfully', { 
      interest_id: id,
      updated_fields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Interest updated successfully',
      data: updatedInterest
    });
  } catch (error) {
    logger.error('Update interest failed:', { id, updateData, error: error.message });
    throw error;
  }
});

// Delete interest
const deleteInterest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const deletedInterest = await interestsModel.delete(id);
    
    if (!deletedInterest) {
      return res.status(404).json({
        success: false,
        error: 'Interest not found',
        code: 'INTEREST_NOT_FOUND'
      });
    }

    logger.info('Interest deleted successfully', { 
      interest_id: id,
      name: deletedInterest.name
    });

    res.json({
      success: true,
      message: 'Interest deleted successfully',
      data: { interest_id: id }
    });
  } catch (error) {
    logger.error('Delete interest failed:', { id, error: error.message });
    throw error;
  }
});

module.exports = {
  getInterests,
  searchInterests,
  createInterest,
  updateInterest,
  deleteInterest
};
