const researchProjectsModel = require('../models/research_projects.model');
const { asyncHandler } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

// Get all research projects
const getResearchProjects = asyncHandler(async (req, res) => {
  const filters = req.query;
  const { page = 1, limit = 20 } = filters;

  try {
    const [projects, total] = await Promise.all([
      researchProjectsModel.findAllWithDetails(filters),
      researchProjectsModel.count(filters)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        projects,
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
    logger.error('Get research projects failed:', { filters, error: error.message });
    throw error;
  }
});

// Get research project by ID
const getResearchProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const project = await researchProjectsModel.getByIdWithDetails(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Research project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    logger.error('Get research project by ID failed:', { id, error: error.message });
    throw error;
  }
});

// Create new research project
const createResearchProject = asyncHandler(async (req, res) => {
  const projectData = req.body;
  const { required_skill_ids, ...projectInfo } = projectData;

  try {
    const project = await researchProjectsModel.create(projectInfo);
    
    // Add required skills if provided
    if (required_skill_ids && required_skill_ids.length > 0) {
      await researchProjectsModel.addRequiredSkills(project.project_id, required_skill_ids);
    }
    
    logger.info('Research project created successfully', { 
      project_id: project.project_id,
      title: project.title,
      faculty_id: project.faculty_id
    });

    res.status(201).json({
      success: true,
      message: 'Research project created successfully',
      data: project
    });
  } catch (error) {
    logger.error('Create research project failed:', { projectData, error: error.message });
    throw error;
  }
});

// Update research project
const updateResearchProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedProject = await researchProjectsModel.update(id, updateData);
    
    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        error: 'Research project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    logger.info('Research project updated successfully', { 
      project_id: id,
      updated_fields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Research project updated successfully',
      data: updatedProject
    });
  } catch (error) {
    logger.error('Update research project failed:', { id, updateData, error: error.message });
    throw error;
  }
});

// Delete research project
const deleteResearchProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProject = await researchProjectsModel.delete(id);
    
    if (!deletedProject) {
      return res.status(404).json({
        success: false,
        error: 'Research project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    logger.info('Research project deleted successfully', { 
      project_id: id,
      title: deletedProject.title
    });

    res.json({
      success: true,
      message: 'Research project deleted successfully',
      data: { project_id: id }
    });
  } catch (error) {
    logger.error('Delete research project failed:', { id, error: error.message });
    throw error;
  }
});

// Add participant to project
const addParticipant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { student_id, role, start_date, end_date } = req.body;

  try {
    const participant = await researchProjectsModel.addParticipant(id, student_id, role, start_date, end_date);
    
    logger.info('Participant added to research project', { 
      project_id: id,
      student_id,
      role
    });

    res.json({
      success: true,
      message: 'Participant added successfully',
      data: participant
    });
  } catch (error) {
    logger.error('Add participant failed:', { project_id: id, student_id, error: error.message });
    throw error;
  }
});

// Remove participant from project
const removeParticipant = asyncHandler(async (req, res) => {
  const { id, student_id } = req.params;

  try {
    const participant = await researchProjectsModel.removeParticipant(id, student_id);
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found in this project',
        code: 'PARTICIPANT_NOT_FOUND'
      });
    }

    logger.info('Participant removed from research project', { 
      project_id: id,
      student_id
    });

    res.json({
      success: true,
      message: 'Participant removed successfully'
    });
  } catch (error) {
    logger.error('Remove participant failed:', { project_id: id, student_id, error: error.message });
    throw error;
  }
});

module.exports = {
  getResearchProjects,
  getResearchProjectById,
  createResearchProject,
  updateResearchProject,
  deleteResearchProject,
  addParticipant,
  removeParticipant
};
