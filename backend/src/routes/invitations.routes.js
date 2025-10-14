const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const Joi = require('joi');

const invitationsController = require('../controllers/invitations.controller');
const placementInvitationsController = require('../controllers/placement_invitations.controller');

// Schemas
const studentIdSchema = Joi.string()
  .pattern(/^[A-Za-z0-9._-]+$/)
  .min(4)
  .max(100)
  .messages({ 'string.pattern.base': 'student_id must contain only letters, numbers, dots, hyphens, or underscores' });

const createInviteSchema = Joi.object({
  student_id: studentIdSchema.required(),
  role: Joi.string().max(50).optional(),
});

const respondSchema = Joi.object({
  action: Joi.string().valid('ACCEPT', 'DECLINE').required(),
});

// Create invitation (Club/Admin)
router.post(
  '/clubs/:id/invitations',
  authenticateToken,
  (req, res, next) => validate.validate(createInviteSchema)(req, res, next),
  invitationsController.createInvitation
);

// List invitations for club (Club/Admin)
router.get('/clubs/:id/invitations', authenticateToken, invitationsController.listClubInvitations);

// List invitations for student (Student/Admin)
router.get('/students/:id/invitations', authenticateToken, invitationsController.listStudentInvitations);

// Respond to invitation (Student/Admin)
router.post(
  '/invitations/:id/respond',
  authenticateToken,
  (req, res, next) => validate.validate(respondSchema)(req, res, next),
  invitationsController.respondInvitation
);

// Delete club invitation (Student/Admin)
router.delete(
  '/invitations/:id',
  authenticateToken,
  invitationsController.deleteInvitation
);

// Placement invitations (CIR/Admin)
const createPlacementInviteSchema = Joi.object({
  student_id: studentIdSchema.required(),
  job_role_id: Joi.string().uuid().optional(),
});

// Create placement invitation (CIR/Admin)
router.post(
  '/companies/:id/invitations',
  authenticateToken,
  (req, res, next) => validate.validate(createPlacementInviteSchema)(req, res, next),
  placementInvitationsController.createInvitation
);

// List placement invitations for company (CIR/Admin)
router.get('/companies/:id/invitations', authenticateToken, placementInvitationsController.listCompanyInvitations);

// List placement invitations for student (Student/Admin)
router.get('/students/:id/placement-invitations', authenticateToken, placementInvitationsController.listStudentInvitations);

// Respond to placement invitation (Student/Admin)
router.post(
  '/placement-invitations/:id/respond',
  authenticateToken,
  (req, res, next) => validate.validate(respondSchema)(req, res, next),
  placementInvitationsController.respondInvitation
);

// Delete placement invitation (Student/Admin)
router.delete(
  '/placement-invitations/:id',
  authenticateToken,
  placementInvitationsController.deleteInvitation
);

// Bulk placement invitations (CIR/Admin)
const bulkPlacementInviteSchema = Joi.object({
  student_ids: Joi.array().items(studentIdSchema).min(1).required(),
  job_role_id: Joi.string().uuid().optional(),
});

router.post(
  '/companies/:id/invitations/bulk',
  authenticateToken,
  (req, res, next) => validate.validate(bulkPlacementInviteSchema)(req, res, next),
  placementInvitationsController.createBulkInvitations
);

module.exports = router;