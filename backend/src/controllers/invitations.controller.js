const { asyncHandler } = require('../middleware/error.middleware');
const invitationsModel = require('../models/invitations.model');

// Create invite: CLUB owner or ADMIN
const createInvitation = asyncHandler(async (req, res) => {
  const { id: clubId } = req.params;
  const { student_id, role } = req.body;
  const user = req.user || {};

  if (!student_id) {
    return res.status(400).json({ success: false, error: 'student_id is required' });
  }

  const isClubOwner = user.role === 'CLUB' && String(user.profile_ref_id) === String(clubId);
  const isAdmin = user.role === 'ADMIN';
  if (!isClubOwner && !isAdmin) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }

  // Prevent inviting students who are already members
  const alreadyMember = await invitationsModel.isStudentActiveMember(clubId, student_id);
  if (alreadyMember) {
    return res.status(409).json({
      success: false,
      error: 'Student is already a member of this club',
      code: 'STUDENT_ALREADY_MEMBER'
    });
  }

  const invite = await invitationsModel.createInvitation(
    clubId,
    student_id,
    user.profile_ref_id || user.user_id,
    role || null
  );
  return res.status(201).json({ success: true, message: 'Invitation created', data: invite });
});

// List invitations for club: CLUB owner or ADMIN
const listClubInvitations = asyncHandler(async (req, res) => {
  const { id: clubId } = req.params;
  const user = req.user || {};
  const isClubOwner = user.role === 'CLUB' && String(user.profile_ref_id) === String(clubId);
  const isAdmin = user.role === 'ADMIN';
  if (!isClubOwner && !isAdmin) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }

  const invites = await invitationsModel.listForClub(clubId);
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

  const invites = await invitationsModel.listForStudent(studentId);
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

  const invite = await invitationsModel.getInvitationById(id);
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

  const updated = await invitationsModel.respondInvitation(id, action, user.user_id || null);

  let membership = null;
  if (action === 'ACCEPT') {
    membership = await invitationsModel.acceptAndAddMembership(invite);
  }

  return res.json({ success: true, message: `Invitation ${action.toLowerCase()}ed`, data: { invite: updated, membership } });
});

module.exports = {
  createInvitation,
  listClubInvitations,
  listStudentInvitations,
  respondInvitation,
  // Delete invitation: STUDENT owner or ADMIN
  deleteInvitation: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user || {};

    const invite = await invitationsModel.getInvitationById(id);
    if (!invite) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    const isStudentOwner = user.role === 'STUDENT' && String(user.profile_ref_id) === String(invite.student_id);
    const isAdmin = user.role === 'ADMIN';
    if (!isStudentOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    await invitationsModel.deleteInvitation(id);
    return res.json({ success: true, message: 'Invitation deleted', data: { id } });
  })
};