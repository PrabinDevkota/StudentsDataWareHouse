const clubsModel = require('../models/clubs.model');
const matchService = require('../services/match.service');
const { asyncHandler } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

// Get all clubs
const getClubs = asyncHandler(async (req, res) => {
  try {
    const clubs = await clubsModel.findAllWithStats();
    
    res.json({
      success: true,
      data: clubs
    });
  } catch (error) {
    logger.error('Get clubs failed:', { error: error.message });
    throw error;
  }
});

// Get club by ID
const getClubById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const club = await clubsModel.getByIdWithMembers(id);
    
    if (!club) {
      return res.status(404).json({
        success: false,
        error: 'Club not found',
        code: 'CLUB_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: club
    });
  } catch (error) {
    logger.error('Get club by ID failed:', { id, error: error.message });
    throw error;
  }
});

// Create new club
const createClub = asyncHandler(async (req, res) => {
  const clubData = req.body;

  try {
    // Check if club name already exists
    const existingClub = await clubsModel.query(
      'SELECT club_id FROM clubs WHERE LOWER(name) = LOWER(?)',
      [clubData.name]
    );
    
    if (existingClub.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Club name already exists',
        code: 'DUPLICATE_CLUB_NAME'
      });
    }

    const club = await clubsModel.create(clubData);
    
    logger.info('Club created successfully', { 
      club_id: club.club_id,
      name: club.name
    });

    res.status(201).json({
      success: true,
      message: 'Club created successfully',
      data: club
    });
  } catch (error) {
    logger.error('Create club failed:', { clubData, error: error.message });
    throw error;
  }
});

// Update club
const updateClub = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedClub = await clubsModel.update(id, updateData);
    
    if (!updatedClub) {
      return res.status(404).json({
        success: false,
        error: 'Club not found',
        code: 'CLUB_NOT_FOUND'
      });
    }

    logger.info('Club updated successfully', { 
      club_id: id,
      updated_fields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Club updated successfully',
      data: updatedClub
    });
  } catch (error) {
    logger.error('Update club failed:', { id, updateData, error: error.message });
    throw error;
  }
});

// Delete club
const deleteClub = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const deletedClub = await clubsModel.delete(id);
    
    if (!deletedClub) {
      return res.status(404).json({
        success: false,
        error: 'Club not found',
        code: 'CLUB_NOT_FOUND'
      });
    }

    logger.info('Club deleted successfully', { 
      club_id: id,
      name: deletedClub.name
    });

    res.json({
      success: true,
      message: 'Club deleted successfully',
      data: { club_id: id }
    });
  } catch (error) {
    logger.error('Delete club failed:', { id, error: error.message });
    throw error;
  }
});

// Get candidates for club
const getCandidates = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const filters = req.query;

  try {
    const result = await matchService.findCandidatesForClub(id, filters);
    
    logger.info('Candidates retrieved for club', { 
      club_id: id,
      candidate_count: result.candidates.length,
      total: result.total
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get candidates failed:', { club_id: id, filters, error: error.message });
    throw error;
  }
});

// Add member to club
const addMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { student_id, role, start_date } = req.body;

  try {
    const membership = await clubsModel.addMember(id, student_id, role, start_date);
    
    logger.info('Member added to club', { 
      club_id: id,
      student_id,
      role
    });

    res.json({
      success: true,
      message: 'Member added successfully',
      data: membership
    });
  } catch (error) {
    logger.error('Add member failed:', { club_id: id, student_id, error: error.message });
    throw error;
  }
});

// Remove member from club
const removeMember = asyncHandler(async (req, res) => {
  const { id, student_id } = req.params;

  try {
    const membership = await clubsModel.removeMember(id, student_id);
    
    if (!membership) {
      return res.status(404).json({
        success: false,
        error: 'Member not found in this club',
        code: 'MEMBER_NOT_FOUND'
      });
    }

    logger.info('Member removed from club', { 
      club_id: id,
      student_id
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    logger.error('Remove member failed:', { club_id: id, student_id, error: error.message });
    throw error;
  }
});

module.exports = {
  getClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
  getCandidates,
  addMember,
  removeMember
};
