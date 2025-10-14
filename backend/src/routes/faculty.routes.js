const express = require('express');
const facultyController = require('../controllers/faculty.controller');
const { authenticateToken, requireAdmin, requireFacultyOrAdmin, requireOwnershipOrAdmin } = require('../middleware/auth.middleware');
const { uploadImportFile, handleUploadError } = require('../services/upload.service');
const { validateFacultyCreate, validateFacultyUpdate } = require('../middleware/validate.middleware');

const router = express.Router();

// Public routes
router.get('/', facultyController.getFaculty);

// Protected routes
router.use(authenticateToken);

router.get('/:id', facultyController.getFacultyById);
router.put('/:id', requireOwnershipOrAdmin('id', 'FACULTY'), validateFacultyUpdate, facultyController.updateFaculty);

// Admin only routes
router.post('/', requireAdmin, validateFacultyCreate, facultyController.createFaculty);
router.delete('/:id', requireAdmin, facultyController.deleteFaculty);

// Bulk import faculty via Excel (Admin only)
router.post('/import', authenticateToken, requireAdmin, uploadImportFile, handleUploadError, facultyController.importFacultyFromExcel);

module.exports = router;
