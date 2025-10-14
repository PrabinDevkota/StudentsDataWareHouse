const companiesModel = require('../models/companies.model');
const matchService = require('../services/match.service');
const { asyncHandler } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

// Get all companies
const getCompanies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  try {
    let companies;
    let total;

    if (search) {
      companies = await companiesModel.search(search);
      total = companies.length;
    } else {
      const pagination = { page: parseInt(page), limit: parseInt(limit) };
      companies = await companiesModel.findAll({}, pagination);
      total = await companiesModel.count();
    }

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        companies,
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
    logger.error('Get companies failed:', { error: error.message });
    throw error;
  }
});

// Get company by ID
const getCompanyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const company = await companiesModel.getByIdWithDetails(id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
        code: 'COMPANY_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    logger.error('Get company by ID failed:', { id, error: error.message });
    throw error;
  }
});

// Create new company
const createCompany = asyncHandler(async (req, res) => {
  const companyData = req.body;

  try {
    // Check if company name already exists
    const existingCompany = await companiesModel.findByName(companyData.name);
    if (existingCompany) {
      return res.status(409).json({
        success: false,
        error: 'Company name already exists',
        code: 'DUPLICATE_COMPANY_NAME'
      });
    }

    const company = await companiesModel.create(companyData);
    
    logger.info('Company created successfully', { 
      company_id: company.company_id,
      name: company.name
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    });
  } catch (error) {
    logger.error('Create company failed:', { companyData, error: error.message });
    throw error;
  }
});

// Update company
const updateCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedCompany = await companiesModel.update(id, updateData);
    
    if (!updatedCompany) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
        code: 'COMPANY_NOT_FOUND'
      });
    }

    logger.info('Company updated successfully', { 
      company_id: id,
      updated_fields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: updatedCompany
    });
  } catch (error) {
    logger.error('Update company failed:', { id, updateData, error: error.message });
    throw error;
  }
});

// Delete company
const deleteCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCompany = await companiesModel.delete(id);
    
    if (!deletedCompany) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
        code: 'COMPANY_NOT_FOUND'
      });
    }

    logger.info('Company deleted successfully', { 
      company_id: id,
      name: deletedCompany.name
    });

    res.json({
      success: true,
      message: 'Company deleted successfully',
      data: { company_id: id }
    });
  } catch (error) {
    logger.error('Delete company failed:', { id, error: error.message });
    throw error;
  }
});

// Get candidates for company
const getCandidates = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const filters = req.query;

  try {
    const result = await matchService.findCandidatesForCompany(id, filters);
    
    logger.info('Candidates retrieved for company', { 
      company_id: id,
      candidate_count: result.candidates.length,
      total: result.total
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get candidates failed:', { company_id: id, filters, error: error.message });
    throw error;
  }
});

// Create job role
const createJobRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const jobRoleData = { ...req.body, company_id: id };

  try {
    const insertSql = `
      INSERT INTO company_job_roles (company_id, title, description, requirements, salary_range, location, role_type, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await companiesModel.query(insertSql, [
      id,
      jobRoleData.title,
      jobRoleData.description,
      jobRoleData.requirements,
      jobRoleData.salary_range,
      jobRoleData.location,
      jobRoleData.role_type || null,
      jobRoleData.is_active !== undefined ? jobRoleData.is_active : true
    ]);
    const selectSql = `
      SELECT * FROM company_job_roles 
      WHERE company_id = ? AND title = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const jobRole = await companiesModel.query(selectSql, [id, jobRoleData.title]);

    logger.info('Job role created successfully', { 
      company_id: id,
      job_role_id: jobRole.rows[0].job_role_id,
      title: jobRole.rows[0].title
    });

    res.status(201).json({
      success: true,
      message: 'Job role created successfully',
      data: jobRole.rows[0]
    });
  } catch (error) {
    logger.error('Create job role failed:', { company_id: id, jobRoleData, error: error.message });
    throw error;
  }
});

// Update job role
const updateJobRole = asyncHandler(async (req, res) => {
  const { id, job_role_id } = req.params;
  const updateData = req.body;

  try {
    const updateSql = `
      UPDATE company_job_roles 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          requirements = COALESCE(?, requirements),
          salary_range = COALESCE(?, salary_range),
          location = COALESCE(?, location),
          role_type = COALESCE(?, role_type),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE job_role_id = ? AND company_id = ?
    `;
    await companiesModel.query(updateSql, [
      updateData.title ?? null,
      updateData.description ?? null,
      updateData.requirements ?? null,
      updateData.salary_range ?? null,
      updateData.location ?? null,
      updateData.role_type ?? null,
      updateData.is_active ?? null,
      job_role_id,
      id
    ]);
    const result = await companiesModel.query('SELECT * FROM company_job_roles WHERE job_role_id = ? AND company_id = ?', [job_role_id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job role not found',
        code: 'JOB_ROLE_NOT_FOUND'
      });
    }

    logger.info('Job role updated successfully', { 
      company_id: id,
      job_role_id,
      updated_fields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Job role updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Update job role failed:', { company_id: id, job_role_id, updateData, error: error.message });
    throw error;
  }
});

// Delete job role
const deleteJobRole = asyncHandler(async (req, res) => {
  const { id, job_role_id } = req.params;

  try {
    const before = await companiesModel.query('SELECT * FROM company_job_roles WHERE job_role_id = ? AND company_id = ?', [job_role_id, id]);
    const result = await companiesModel.query('DELETE FROM company_job_roles WHERE job_role_id = ? AND company_id = ?', [job_role_id, id]);
    const affected = result.meta?.affectedRows ?? 0;
    if ((before.rows.length === 0) || affected === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job role not found',
        code: 'JOB_ROLE_NOT_FOUND'
      });
    }

    logger.info('Job role deleted successfully', { 
      company_id: id,
      job_role_id
    });

    res.json({
      success: true,
      message: 'Job role deleted successfully'
    });
  } catch (error) {
    logger.error('Delete job role failed:', { company_id: id, job_role_id, error: error.message });
    throw error;
  }
});

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCandidates,
  createJobRole,
  updateJobRole,
  deleteJobRole
};
