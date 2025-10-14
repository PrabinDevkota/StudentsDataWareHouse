const { BaseModel } = require('./index');

class ClubsModel extends BaseModel {
  constructor() {
    super('clubs');
  }

  // Get clubs with member count
  async findAllWithStats() {
    const query = `
      SELECT 
        c.*,
        COUNT(DISTINCT cm.student_id) as member_count,
        COUNT(DISTINCT CASE WHEN cm.is_active = true THEN cm.student_id END) as active_member_count
      FROM clubs c
      LEFT JOIN club_memberships cm ON c.club_id = cm.club_id
      GROUP BY c.club_id
      ORDER BY c.name
    `;
    
    const result = await this.query(query);
    return result.rows;
  }

  // Get club by ID with members
  async getByIdWithMembers(id) {
    const query = `
      SELECT 
        c.*,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'student_id', s.student_id,
                'first_name', s.first_name,
                'last_name', s.last_name,
                'email', s.email,
                'role', cm.role,
                'start_date', cm.start_date,
                'end_date', cm.end_date,
                'is_active', cm.is_active
              )
            )
            FROM club_memberships cm
            JOIN students s ON cm.student_id = s.student_id
            WHERE cm.club_id = c.club_id
          ), JSON_ARRAY()
        ) AS members
      FROM clubs c
      WHERE c.club_id = ?
      GROUP BY c.club_id
    `;

    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  // Add member to club
  async addMember(clubId, studentId, role, startDate) {
    const insertSql = `
      INSERT INTO club_memberships (club_id, student_id, role, start_date)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        role = VALUES(role),
        is_active = true
    `;

    await this.query(insertSql, [clubId, studentId, role, startDate]);
    const selectSql = `
      SELECT * FROM club_memberships 
      WHERE club_id = ? AND student_id = ? AND start_date = ?
      ORDER BY start_date DESC
      LIMIT 1
    `;
    const result = await this.query(selectSql, [clubId, studentId, startDate]);
    return result.rows[0];
  }

  // Remove member from club
  async removeMember(clubId, studentId) {
    const updateSql = `
      UPDATE club_memberships 
      SET is_active = false, end_date = CURRENT_DATE
      WHERE club_id = ? AND student_id = ? AND is_active = true
    `;
    await this.query(updateSql, [clubId, studentId]);
    const selectSql = `
      SELECT * FROM club_memberships 
      WHERE club_id = ? AND student_id = ? AND is_active = false
      ORDER BY start_date DESC
      LIMIT 1
    `;
    const result = await this.query(selectSql, [clubId, studentId]);
    return result.rows[0];
  }

  // Get active members
  async getActiveMembers(clubId) {
    const query = `
      SELECT 
        s.student_id,
        s.first_name,
        s.last_name,
        s.email,
        cm.role,
        cm.start_date
      FROM club_memberships cm
      JOIN students s ON cm.student_id = s.student_id
      WHERE cm.club_id = ? AND cm.is_active = true
      ORDER BY cm.start_date DESC
    `;

    const result = await this.query(query, [clubId]);
    return result.rows;
  }
}

module.exports = new ClubsModel();
