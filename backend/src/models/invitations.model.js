const { BaseModel } = require('./index');
const clubsModel = require('./clubs.model');

class InvitationsModel extends BaseModel {
  constructor() {
    super('club_invitations');
  }
  // Check if the student is already an active member of the club
  async isStudentActiveMember(clubId, studentId) {
    const res = await this.query(
      `SELECT 1 FROM club_memberships 
       WHERE club_id = ? AND student_id = ? AND is_active = true 
       LIMIT 1`,
      [clubId, studentId]
    );
    return res.rows.length > 0;
  }
  async createInvitation(clubId, studentId, createdBy, role = null) {
    const insertSql = `
      INSERT INTO club_invitations (club_id, student_id, status, created_by, role)
      VALUES (?, ?, 'PENDING', ?, ?)
      ON DUPLICATE KEY UPDATE 
        status = 'PENDING',
        role = COALESCE(VALUES(role), role),
        responded_at = NULL,
        responded_by = NULL,
        updated_at = NOW()
    `;

    await this.query(insertSql, [clubId, studentId, createdBy, role]);
    const selectSql = `
      SELECT * FROM club_invitations 
      WHERE club_id = ? AND student_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const res = await this.query(selectSql, [clubId, studentId]);
    return res.rows[0];
  }

  async getInvitationById(id) {
    const res = await this.query('SELECT * FROM club_invitations WHERE id = ?', [id]);
    return res.rows[0];
  }

  async listForClub(clubId) {
    const res = await this.query(
      'SELECT * FROM club_invitations WHERE club_id = ? ORDER BY created_at DESC',
      [clubId]
    );
    return res.rows;
  }

  async listForStudent(studentId) {
    const res = await this.query(
      `SELECT 
        ci.*, 
        c.name as club_name,
        c.description as club_description,
        c.category as club_category
       FROM club_invitations ci
       LEFT JOIN clubs c ON ci.club_id = c.club_id
       WHERE ci.student_id = ?
       ORDER BY ci.created_at DESC`,
      [studentId]
    );
    return res.rows;
  }

  async respondInvitation(id, action, respondedBy) {
    const status = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
    const updateSql = `
      UPDATE club_invitations
      SET status = ?,
          responded_at = NOW(),
          responded_by = ?,
          updated_at = NOW()
      WHERE id = ?
    `;
    await this.query(updateSql, [status, respondedBy, id]);
    const res = await this.query('SELECT * FROM club_invitations WHERE id = ?', [id]);
    return res.rows[0];
  }

  async deleteInvitation(id) {
    await this.query('DELETE FROM club_invitations WHERE id = ?', [id]);
    return { id };
  }

  async acceptAndAddMembership(invite) {
    // Adds membership upon acceptance
    const startDate = new Date().toISOString().split('T')[0];
    const role = invite.role || 'Member';
    const membership = await clubsModel.addMember(invite.club_id, invite.student_id, role, startDate);
    return membership;
  }
}

module.exports = new InvitationsModel();