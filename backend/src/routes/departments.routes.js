const express = require('express');
const departmentsController = require('../controllers/departments.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', departmentsController.getDepartments);
router.get('/:id', departmentsController.getDepartmentById);

// Protected routes (Admin only)
router.use(authenticateToken);
router.use(requireAdmin);

router.post('/', departmentsController.createDepartment);
router.put('/:id', departmentsController.updateDepartment);
router.delete('/:id', departmentsController.deleteDepartment);

module.exports = router;
