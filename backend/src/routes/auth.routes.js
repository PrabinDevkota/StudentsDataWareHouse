const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');
const { validateLogin, validateUserCreate } = require('../middleware/validate.middleware');

const router = express.Router();

// Public routes
router.post('/login', validateLogin, authController.login);
router.post('/student-login', authController.studentLogin);
router.post('/faculty-login', authController.facultyLogin);
router.post('/club-login', authController.clubLogin);

// Protected routes
router.use(authenticateToken);

router.get('/me', authController.getProfile);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.put('/change-password', authController.changePassword);

// Admin only routes
router.post('/register', requireAdmin, validateUserCreate, authController.register);

module.exports = router;
