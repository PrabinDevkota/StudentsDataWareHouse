const { BaseModel } = require('./index');

class ResearchProjectsModel extends BaseModel {
  constructor() {
    super('research_projects');
  }

  // Get research projects with faculty and participant details
  async findAllWithDetails(filters = {}, pagination = {}) {
    const {
      faculty_id,
      status,
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    let query = `
      SELECT 
        rp.*,
        f.first_name as faculty_first_name,
        f.last_name as faculty_last_name,
        f.email as faculty_email,
        d.name as department_name,
        COUNT(DISTINCT rpp.student_id) as participant_count
      FROM research_projects rp
      LEFT JOIN faculty f ON rp.faculty_id = f.faculty_id
      LEFT JOIN departments d ON f.department_id = d.department_id
      LEFT JOIN research_project_participants rpp ON rp.project_id = rpp.project_id
    `;

    // Add filters
    if (faculty_id) {
      conditions.push(`rp.faculty_id = ?`);
      params.push(faculty_id);
    }

    if (status) {
      conditions.push(`rp.status = ?`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY rp.project_id, f.faculty_id, d.department_id`;
    query += ` ORDER BY rp.${sort} ${order}`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await this.query(query, params);
    return result.rows;
  }

  // Get project by ID with full details
  async getByIdWithDetails(id) {
    const query = `
      SELECT 
        rp.*,
        f.first_name as faculty_first_name,
        f.last_name as faculty_last_name,
        f.email as faculty_email,
        f.specialization as faculty_specialization,
        d.name as department_name,
        d.code as department_code,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(JSON_OBJECT(
              'skill_id', s.skill_id,
              'name', s.name,
              'category', s.category
            ))
            FROM research_project_required_skills rprs2
            JOIN skills s ON rprs2.skill_id = s.skill_id
            WHERE rprs2.project_id = rp.project_id
          ), JSON_ARRAY()
        ) AS required_skills,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(JSON_OBJECT(
              'student_id', st.student_id,
              'first_name', st.first_name,
              'last_name', st.last_name,
              'email', st.email,
              'role', rpp2.role,
              'start_date', rpp2.start_date,
              'end_date', rpp2.end_date
            ))
            FROM research_project_participants rpp2
            JOIN students st ON rpp2.student_id = st.student_id
            WHERE rpp2.project_id = rp.project_id
          ), JSON_ARRAY()
        ) AS participants
      FROM research_projects rp
      LEFT JOIN faculty f ON rp.faculty_id = f.faculty_id
      LEFT JOIN departments d ON f.department_id = d.department_id
      WHERE rp.project_id = ?
    `;

    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  // Add required skills to project
  async addRequiredSkills(projectId, skillIds) {
    if (!skillIds || skillIds.length === 0) return;

    const values = skillIds.map(() => '(?, ?)').join(', ');
    const params = skillIds.flatMap((sid) => [projectId, sid]);

    const query = `
      INSERT IGNORE INTO research_project_required_skills (project_id, skill_id)
      VALUES ${values}
    `;

    await this.query(query, params);
  }

  // Add participant to project
  async addParticipant(projectId, studentId, role, startDate, endDate = null) {
    const insertSql = `
      INSERT INTO research_project_participants (project_id, student_id, role, start_date, end_date)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        role = VALUES(role),
        start_date = VALUES(start_date),
        end_date = VALUES(end_date)
    `;

    await this.query(insertSql, [projectId, studentId, role, startDate, endDate]);
    const selectSql = `
      SELECT * FROM research_project_participants 
      WHERE project_id = ? AND student_id = ?
      LIMIT 1
    `;
    const result = await this.query(selectSql, [projectId, studentId]);
    return result.rows[0];
  }

  // Remove participant from project
  async removeParticipant(projectId, studentId) {
    const before = await this.query(
      `SELECT * FROM research_project_participants WHERE project_id = ? AND student_id = ?`,
      [projectId, studentId]
    );
    await this.query(
      `DELETE FROM research_project_participants WHERE project_id = ? AND student_id = ?`,
      [projectId, studentId]
    );
    return before.rows[0] || null;
  }

  // Get projects by faculty
  async findByFaculty(facultyId) {
    const query = `
      SELECT 
        rp.*,
        COUNT(DISTINCT rpp.student_id) as participant_count
      FROM research_projects rp
      LEFT JOIN research_project_participants rpp ON rp.project_id = rpp.project_id
      WHERE rp.faculty_id = ?
      GROUP BY rp.project_id
      ORDER BY rp.created_at DESC
    `;

    const result = await this.query(query, [facultyId]);
    return result.rows;
  }

  // Get projects by student participation
  async findByStudent(studentId) {
    const query = `
      SELECT 
        rp.*,
        f.first_name as faculty_first_name,
        f.last_name as faculty_last_name,
        rpp.role,
        rpp.start_date as participation_start_date,
        rpp.end_date as participation_end_date
      FROM research_projects rp
      JOIN research_project_participants rpp ON rp.project_id = rpp.project_id
      LEFT JOIN faculty f ON rp.faculty_id = f.faculty_id
      WHERE rpp.student_id = ?
      ORDER BY rpp.start_date DESC
    `;

    const result = await this.query(query, [studentId]);
    return result.rows;
  }
}

module.exports = new ResearchProjectsModel();
