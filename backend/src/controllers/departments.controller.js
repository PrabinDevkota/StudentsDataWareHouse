const departmentsModel = require('../models/departments.model');
const { asyncHandler } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

// Get all departments
const getDepartments = asyncHandler(async (req, res) => {
  try {
    const departments = await departmentsModel.findAll();
    
    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    logger.error('Get departments failed:', { error: error.message });
    throw error;
  }
});

// Get department by ID
const getDepartmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const department = await departmentsModel.findById(id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    logger.error('Get department by ID failed:', { id, error: error.message });
    throw error;
  }
});

// Create new department (Admin only)
const createDepartment = asyncHandler(async (req, res) => {
  const departmentData = req.body;

  try {
    // Validate required fields
    const requiredFields = ['name', 'code'];
    const missingFields = requiredFields.filter(field => !departmentData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Create department
    const department = await departmentsModel.create(departmentData);

    res.status(201).json({
      success: true,
      data: department,
      message: 'Department created successfully'
    });
  } catch (error) {
    logger.error('Create department failed:', { departmentData, error: error.message });
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      const field = error.constraint.includes('email') ? 'email' : 'code';
      return res.status(400).json({
        success: false,
        message: `Department with this ${field} already exists`
      });
    }
    
    throw error;
  }
});

// Update department (Admin only)
const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const department = await departmentsModel.update(id, updateData);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: department,
      message: 'Department updated successfully'
    });
  } catch (error) {
    logger.error('Update department failed:', { id, updateData, error: error.message });
    throw error;
  }
});

// Delete department (Admin only)
const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await departmentsModel.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    logger.error('Delete department failed:', { id, error: error.message });
    throw error;
  }
});

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
