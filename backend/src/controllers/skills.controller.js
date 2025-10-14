const skillsModel = require('../models/skills.model');
const { asyncHandler } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

// Get all skills
const getSkills = asyncHandler(async (req, res) => {
  try {
    const skills = await skillsModel.findAllWithStats();
    
    res.json({
      success: true,
      data: skills
    });
  } catch (error) {
    logger.error('Get skills failed:', { error: error.message });
    throw error;
  }
});

// Search skills
const searchSkills = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required',
      code: 'MISSING_QUERY'
    });
  }

  try {
    const skills = await skillsModel.searchByName(q);
    
    res.json({
      success: true,
      data: skills
    });
  } catch (error) {
    logger.error('Search skills failed:', { query: q, error: error.message });
    throw error;
  }
});

// Create new skill
const createSkill = asyncHandler(async (req, res) => {
  const { name, category } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Skill name is required',
      code: 'MISSING_SKILL_NAME'
    });
  }

  try {
    // Check if skill already exists
    const existingSkill = await skillsModel.findByName(name);
    if (existingSkill) {
      return res.status(409).json({
        success: false,
        error: 'Skill already exists',
        code: 'DUPLICATE_SKILL'
      });
    }

    const skill = await skillsModel.create({
      name: name.trim(),
      category: category ? String(category).trim() : null
    });
    
    logger.info('Skill created successfully', { 
      skill_id: skill.skill_id,
      name: skill.name
    });

    res.status(201).json({
      success: true,
      message: 'Skill created successfully',
      data: skill
    });
  } catch (error) {
    logger.error('Create skill failed:', { skillData, error: error.message });
    throw error;
  }
});

// Update skill
const updateSkill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = String(name).trim();
  if (category !== undefined) updateData.category = String(category).trim();

  try {
    const updatedSkill = Object.keys(updateData).length > 0
      ? await skillsModel.update(id, updateData)
      : await skillsModel.findById(id);
    
    if (!updatedSkill) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found',
        code: 'SKILL_NOT_FOUND'
      });
    }

    logger.info('Skill updated successfully', { 
      skill_id: id,
      updated_fields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Skill updated successfully',
      data: updatedSkill
    });
  } catch (error) {
    logger.error('Update skill failed:', { id, updateData, error: error.message });
    throw error;
  }
});

// Delete skill
const deleteSkill = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSkill = await skillsModel.delete(id);
    
    if (!deletedSkill) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found',
        code: 'SKILL_NOT_FOUND'
      });
    }

    logger.info('Skill deleted successfully', { 
      skill_id: id,
      name: deletedSkill.name
    });

    res.json({
      success: true,
      message: 'Skill deleted successfully',
      data: { skill_id: id }
    });
  } catch (error) {
    logger.error('Delete skill failed:', { id, error: error.message });
    throw error;
  }
});

module.exports = {
  getSkills,
  searchSkills,
  createSkill,
  updateSkill,
  deleteSkill
};
