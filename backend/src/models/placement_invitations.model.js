const { BaseModel } = require('./index');

class PlacementInvitationsModel extends BaseModel {
  constructor() {
    super('placement_invitations');
  }

  async createInvitation(companyId, studentId, createdBy, jobRoleId = null) {
    const insertSql = `
      INSERT INTO placement_invitations (company_id, student_id, status, created_by, job_role_id)
      VALUES (?, ?, 'PENDING', ?, ?)
      ON DUPLICATE KEY UPDATE 
        status = 'PENDING',
        responded_at = NULL,
        responded_by = NULL,
        updated_at = NOW()
    `;

    await this.query(insertSql, [companyId, studentId, createdBy, jobRoleId]);
    const selectSql = `
      SELECT * FROM placement_invitations 
      WHERE company_id = ? AND student_id = ? AND (job_role_id <=> ?)
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const res = await this.query(selectSql, [companyId, studentId, jobRoleId]);
    return res.rows[0];
  }

  async getInvitationById(id) {
    const res = await this.query('SELECT * FROM placement_invitations WHERE id = ?', [id]);
    return res.rows[0];
  }

  async listForCompany(companyId) {
    const res = await this.query(
      `SELECT 
        pi.*, 
        c.name as company_name,
        cjr.title as job_role_title
       FROM placement_invitations pi
       JOIN companies c ON pi.company_id = c.company_id
       LEFT JOIN company_job_roles cjr ON pi.job_role_id = cjr.job_role_id
       WHERE pi.company_id = ?
       ORDER BY pi.created_at DESC`,
      [companyId]
    );
    return res.rows;
  }

  async listForStudent(studentId) {
    const res = await this.query(
      `SELECT 
        pi.*, 
        c.name as company_name,
        cjr.title as job_role_title
       FROM placement_invitations pi
       JOIN companies c ON pi.company_id = c.company_id
       LEFT JOIN company_job_roles cjr ON pi.job_role_id = cjr.job_role_id
       WHERE pi.student_id = ?
       ORDER BY pi.created_at DESC`,
      [studentId]
    );
    return res.rows;
  }

  async respondInvitation(id, action, respondedBy) {
    const status = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
    const updateSql = `
      UPDATE placement_invitations 
      SET status = ?, responded_at = NOW(), responded_by = ?
      WHERE id = ?
    `;
    await this.query(updateSql, [status, respondedBy, id]);
    const sel = await this.query('SELECT * FROM placement_invitations WHERE id = ?', [id]);
    return sel.rows[0];
  }

  async deleteInvitation(id) {
    await this.query('DELETE FROM placement_invitations WHERE id = ?', [id]);
    return { id };
  }

  async createBulkInvitations(companyId, studentIds = [], createdBy, jobRoleId = null) {
    const results = [];
    for (const sid of studentIds) {
      try {
        const invite = await this.createInvitation(companyId, sid, createdBy, jobRoleId);
        results.push({ student_id: sid, status: 'CREATED', invite });
      } catch (err) {
        results.push({ student_id: sid, status: 'ERROR', error: err?.message || 'Unknown error' });
      }
    }
    const successCount = results.filter(r => r.status === 'CREATED').length;
    const errorCount = results.filter(r => r.status === 'ERROR').length;
    return { successCount, errorCount, results };
  }
}

module.exports = new PlacementInvitationsModel();