const express = require('express');
const clubsController = require('../controllers/clubs.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');
const { validateClubCreate, validateClubMember } = require('../middleware/validate.middleware');

const router = express.Router();

// Public routes
router.get('/', clubsController.getClubs);
router.get('/:id', clubsController.getClubById);

// Protected routes
router.use(authenticateToken);

router.get('/:id/candidates', clubsController.getCandidates);
router.post('/:id/members', validateClubMember, clubsController.addMember);
router.delete('/:id/members/:student_id', clubsController.removeMember);

// Admin only routes
router.post('/', requireAdmin, validateClubCreate, clubsController.createClub);
router.put('/:id', requireAdmin, clubsController.updateClub);
router.delete('/:id', requireAdmin, clubsController.deleteClub);

module.exports = router;
