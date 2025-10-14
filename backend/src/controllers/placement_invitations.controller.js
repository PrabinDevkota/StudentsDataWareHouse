const { asyncHandler } = require('../middleware/error.middleware');
const placementInvitationsModel = require('../models/placement_invitations.model');

// Create invitation: CIR or ADMIN
const createInvitation = asyncHandler(async (req, res) => {
  const { id: companyId } = req.params;
  const { student_id, job_role_id } = req.body;
  const user = req.user || {};

  if (!student_id) {
    return res.status(400).json({ success: false, error: 'student_id is required' });
  }

  const isCIR = user.role === 'CIR';
  const isAdmin = user.role === 'ADMIN';
  if (!isCIR && !isAdmin) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }

  const invite = await placementInvitationsModel.createInvitation(
    companyId,
    student_id,
    // created_by must reference users.user_id, not profile_ref_id
    user.user_id,
    job_role_id || null
  );
  return res.status(201).json({ success: true, message: 'Placement suggestion created', data: invite });
});

// List invitations for company: CIR/Admin
const listCompanyInvitations = asyncHandler(async (req, res) => {
  const { id: companyId } = req.params;
  const user = req.user || {};
  const isCIR = user.role === 'CIR';
  const isAdmin = user.role === 'ADMIN';
  if (!isCIR && !isAdmin) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }

  const invites = await placementInvitationsModel.listForCompany(companyId);
  return res.json({ success: true, data: invites });
});

// List invitations for student: STUDENT owner or ADMIN
const listStudentInvitations = asyncHandler(async (req, res) => {
  const { id: studentId } = req.params;
  const user = req.user || {};
  const isStudentOwner = user.role === 'STUDENT' && String(user.profile_ref_id) === String(studentId);
  const isAdmin = user.role === 'ADMIN';
  if (!isStudentOwner && !isAdmin) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }

  const invites = await placementInvitationsModel.listForStudent(studentId);
  return res.json({ success: true, data: invites });
});

// Respond to invitation: STUDENT owner or ADMIN
const respondInvitation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'ACCEPT' | 'DECLINE'
  const user = req.user || {};

  if (!['ACCEPT', 'DECLINE'].includes(action)) {
    return res.status(400).json({ success: false, error: 'Invalid action' });
  }

  const invite = await placementInvitationsModel.getInvitationById(id);
  if (!invite) {
    return res.status(404).json({ success: false, error: 'Invitation not found' });
  }

  const isStudentOwner = user.role === 'STUDENT' && String(user.profile_ref_id) === String(invite.student_id);
  const isAdmin = user.role === 'ADMIN';
  if (!isStudentOwner && !isAdmin) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }

  if (invite.status !== 'PENDING') {
    return res.status(409).json({ success: false, error: 'Invitation already responded' });
  }

  const updated = await placementInvitationsModel.respondInvitation(id, action, user.user_id || null);
  return res.json({ success: true, message: `Invitation ${action.toLowerCase()}ed`, data: { invite: updated } });
});

// Delete placement suggestion: STUDENT owner or ADMIN
const deleteInvitation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user || {};

  const invite = await placementInvitationsModel.getInvitationById(id);
  if (!invite) {
    return res.status(404).json({ success: false, error: 'Suggestion not found' });
  }

  const isStudentOwner = user.role === 'STUDENT' && String(user.profile_ref_id) === String(invite.student_id);
  const isAdmin = user.role === 'ADMIN';
  if (!isStudentOwner && !isAdmin) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }

  await placementInvitationsModel.deleteInvitation(id);
  return res.json({ success: true, message: 'Suggestion deleted', data: { id } });
});

module.exports = {
  createInvitation,
  listCompanyInvitations,
  listStudentInvitations,
  respondInvitation,
  deleteInvitation,
};

// Bulk invitations: CIR/Admin
const createBulkInvitations = asyncHandler(async (req, res) => {
  const { id: companyId } = req.params;
  const { student_ids = [], job_role_id = null } = req.body || {};
  const user = req.user || {};

  const isCIR = user.role === 'CIR';
  const isAdmin = user.role === 'ADMIN';
  if (!isCIR && !isAdmin) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }

  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    return res.status(400).json({ success: false, error: 'student_ids must be a non-empty array' });
  }

  const result = await placementInvitationsModel.createBulkInvitations(companyId, student_ids, user.user_id, job_role_id);
  return res.status(201).json({ success: true, message: 'Bulk placement suggestions processed', data: result });
});

module.exports.createBulkInvitations = createBulkInvitations;