const express = require('express');
const studentsController = require('../controllers/students.controller');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin, optionalAuth, requireOwnershipAdminOrRoles } = require('../middleware/auth.middleware');
const { validateStudentCreate, validateStudentUpdate, validateStudentFilters } = require('../middleware/validate.middleware');
const { uploadAvatar, uploadImportFile, handleUploadError } = require('../services/upload.service');

const router = express.Router();

// Public routes (with optional auth for additional data)
router.get('/', optionalAuth, validateStudentFilters, studentsController.getStudents);

// Student-specific routes (protected)
// Allow STUDENT owner, ADMIN, FACULTY, CLUB, and CIR to view student profile by ID
router.get('/:id', authenticateToken, requireOwnershipAdminOrRoles(['FACULTY', 'CLUB', 'CIR'], 'id', 'STUDENT'), studentsController.getStudentById);
router.put('/:id', authenticateToken, requireOwnershipOrAdmin('id', 'STUDENT'), validateStudentUpdate, studentsController.updateStudent);
// Student skill and interest management
router.get('/:id/skills', studentsController.getStudentSkills);
router.post('/:id/skills', authenticateToken, requireOwnershipOrAdmin('id', 'STUDENT'), studentsController.addSkill);
router.post('/:id/skills/new', authenticateToken, requireOwnershipOrAdmin('id', 'STUDENT'), studentsController.addNewSkill);
router.delete('/:id/skills/:skill_id', authenticateToken, requireOwnershipOrAdmin('id', 'STUDENT'), studentsController.removeSkill);
router.get('/:id/interests', studentsController.getStudentInterests);
router.post('/:id/interests', authenticateToken, requireOwnershipOrAdmin('id', 'STUDENT'), studentsController.addInterest);
router.post('/:id/interests/new', authenticateToken, requireOwnershipOrAdmin('id', 'STUDENT'), studentsController.addNewInterest);
router.delete('/:id/interests/:interest_id', authenticateToken, requireOwnershipOrAdmin('id', 'STUDENT'), studentsController.removeInterest);
// Student achievements management
router.get('/:id/achievements', studentsController.getStudentAchievements);
router.post('/:id/achievements', authenticateToken, requireOwnershipOrAdmin('id', 'STUDENT'), studentsController.addAchievement);
router.delete('/:id/achievements/:achievement_id', authenticateToken, requireOwnershipOrAdmin('id', 'STUDENT'), studentsController.removeAchievement);
// Student certifications management
router.get('/:id/certifications', studentsController.getStudentCertifications);
router.post('/:id/certifications', authenticateToken, requireOwnershipOrAdmin('id', 'STUDENT'), studentsController.addCertification);
router.delete('/:id/certifications/:certification_id', authenticateToken, requireOwnershipOrAdmin('id', 'STUDENT'), studentsController.removeCertification);
router.post('/:id/avatar', authenticateToken, requireOwnershipOrAdmin('id', 'STUDENT'), uploadAvatar, handleUploadError, studentsController.uploadAvatar);

// Admin only routes
router.post('/', authenticateToken, requireAdmin, validateStudentCreate, studentsController.createStudent);
router.delete('/:id', authenticateToken, requireAdmin, studentsController.deleteStudent);

// Bulk import students via Excel (Admin only)
router.post('/import', authenticateToken, requireAdmin, uploadImportFile, handleUploadError, studentsController.importStudentsFromExcel);

module.exports = router;
