const express = require('express');
const companiesController = require('../controllers/companies.controller');
const { authenticateToken, requireAdmin, requireCIROrAdmin } = require('../middleware/auth.middleware');
const { validateCompanyCreate, validateCompanyUpdate, validateJobRoleCreate } = require('../middleware/validate.middleware');

const router = express.Router();

// Public routes
router.get('/', companiesController.getCompanies);
router.get('/:id', companiesController.getCompanyById);

// Protected routes
router.use(authenticateToken);

// CIR/Admin routes
router.get('/:id/candidates', requireCIROrAdmin, companiesController.getCandidates);
router.post('/:id/job-roles', requireCIROrAdmin, validateJobRoleCreate, companiesController.createJobRole);
router.put('/:id/job-roles/:job_role_id', requireCIROrAdmin, companiesController.updateJobRole);
router.delete('/:id/job-roles/:job_role_id', requireCIROrAdmin, companiesController.deleteJobRole);

// Admin only routes
router.post('/', requireCIROrAdmin, validateCompanyCreate, companiesController.createCompany);
router.put('/:id', requireCIROrAdmin, validateCompanyUpdate, companiesController.updateCompany);
router.delete('/:id', requireCIROrAdmin, companiesController.deleteCompany);

module.exports = router;
