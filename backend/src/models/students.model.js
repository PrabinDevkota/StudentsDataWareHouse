const { BaseModel } = require('./index');
const logger = require('../utils/logger');

class StudentsModel extends BaseModel {
  constructor() {
    super('students');
  }

  // Find students with advanced filtering and pagination
  async findByFilters(filters = {}, pagination = {}) {
    const {
      q, // search query for name/email
      skills, // comma-separated skill IDs or names
      interests, // comma-separated interest IDs or names
      min_cgpa,
      max_cgpa,
      department_id,
      semester,
      research_experience,
      min_attendance,
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'DESC',
      fields = '*'
    } = filters;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;
    const params = [];
    const conditions = [];

    // Build base query
    let query = `
      SELECT 
        s.student_id,
        s.first_name,
        s.last_name,
        s.email,
        s.department_id,
        s.semester,
        s.cgpa,
        s.attendance_percentage,
        s.research_experience,
        s.avatar_path,
        d.name as department_name,
        d.code as department_code
      FROM students s
      LEFT JOIN departments d ON s.department_id = d.department_id
    `;

    // Add search query condition (bind four params for MySQL compatibility)
    if (q) {
      const likeVal = `%${q}%`;
      conditions.push(`(LOWER(s.first_name) LIKE LOWER(?) OR LOWER(s.last_name) LIKE LOWER(?) OR LOWER(s.email) LIKE LOWER(?) OR LOWER(s.student_id) LIKE LOWER(?))`);
      params.push(likeVal, likeVal, likeVal, likeVal);
    }

    // Explicit student_id filter (exact match)
    if (filters.student_id) {
      conditions.push(`s.student_id = ?`);
      params.push(filters.student_id);
    }

    // Add CGPA range conditions
    if (min_cgpa !== undefined) {
      conditions.push(`s.cgpa >= ?`);
      params.push(min_cgpa);
    }
    if (max_cgpa !== undefined) {
      conditions.push(`s.cgpa <= ?`);
      params.push(max_cgpa);
    }

    // Add department filter
    if (department_id) {
      conditions.push(`s.department_id = ?`);
      params.push(department_id);
    }

    // Add semester filter
    if (semester) {
      conditions.push(`s.semester = ?`);
      params.push(semester);
    }

    // Add research experience filter
    if (research_experience !== undefined) {
      conditions.push(`s.research_experience = ?`);
      params.push(research_experience);
    }

    // Add attendance filter
    if (min_attendance !== undefined) {
      conditions.push(`s.attendance_percentage >= ?`);
      params.push(min_attendance);
    }

    // Add skills filter (if specified)
    if (skills) {
      const skillNames = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillNames.length > 0) {
        const placeholders = skillNames.map(() => '?').join(', ');
        conditions.push(`s.student_id IN (
          SELECT ss.student_id 
          FROM student_skills ss 
          JOIN skills sk ON ss.skill_id = sk.skill_id 
          WHERE sk.name IN (${placeholders})
        )`);
        skillNames.forEach(name => params.push(name));
      }
    }

    // Add interests filter (if specified)
    if (interests) {
      const interestNames = interests.split(',').map(i => i.trim()).filter(Boolean);
      if (interestNames.length > 0) {
        const placeholders = interestNames.map(() => '?').join(', ');
        conditions.push(`s.student_id IN (
          SELECT si.student_id 
          FROM student_interests si 
          JOIN interests i ON si.interest_id = i.interest_id 
          WHERE i.name IN (${placeholders})
        )`);
        interestNames.forEach(name => params.push(name));
      }
    }

    // Add WHERE clause
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add ORDER BY
    query += ` ORDER BY s.${sort} ${order}`;

    // Add LIMIT and OFFSET
    query += ` LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    // Debug logging
    const result = await this.query(query, params);
    return result.rows;
  }

  // Get student by ID with all related data
  async getByIdWithRelations(id) {
    // Fetch base student with department
    const baseRes = await this.query(
      `
      SELECT 
        s.*,
        d.name AS department_name,
        d.code AS department_code,
        d.description AS department_description
      FROM students s
      LEFT JOIN departments d ON s.department_id = d.department_id
      WHERE s.student_id = ?
      `,
      [id]
    );

    const base = baseRes.rows[0];
    if (!base) return null;

    // Skills
    const skillsRes = await this.query(
      `
      SELECT sk.skill_id, sk.name, sk.category, ss.proficiency_level, ss.acquired_date, ss.student_description
      FROM student_skills ss
      JOIN skills sk ON ss.skill_id = sk.skill_id
      WHERE ss.student_id = ?
      ORDER BY sk.name
      `,
      [id]
    );

    // Interests
    const interestsRes = await this.query(
      `
      SELECT i.interest_id, i.name, i.category, si.student_description
      FROM student_interests si
      JOIN interests i ON si.interest_id = i.interest_id
      WHERE si.student_id = ?
      ORDER BY i.name
      `,
      [id]
    );

    // Club memberships
    const clubsRes = await this.query(
      `
      SELECT c.club_id, c.name AS club_name, cm.role, cm.start_date, cm.end_date, cm.is_active
      FROM club_memberships cm
      JOIN clubs c ON cm.club_id = c.club_id
      WHERE cm.student_id = ?
      ORDER BY cm.start_date DESC
      `,
      [id]
    );

    // Research projects
    const researchRes = await this.query(
      `
      SELECT rp.project_id, rp.title, rp.description, rp.start_date, rp.end_date, rp.status,
             rpp.role, rpp.start_date AS participation_start_date, rpp.end_date AS participation_end_date
      FROM research_project_participants rpp
      JOIN research_projects rp ON rpp.project_id = rp.project_id
      WHERE rpp.student_id = ?
      ORDER BY rp.start_date DESC
      `,
      [id]
    );

    // Internships
    const internshipsRes = await this.query(
      `
      SELECT internship_id, company_name, position, start_date, end_date, description, is_verified
      FROM internships
      WHERE student_id = ?
      ORDER BY start_date DESC
      `,
      [id]
    );

    // Achievements
    const achievementsRes = await this.query(
      `
      SELECT achievement_id, title, description, achievement_date, category, is_verified
      FROM achievements
      WHERE student_id = ?
      ORDER BY (achievement_date IS NULL), achievement_date DESC, created_at DESC
      `,
      [id]
    );

    // Certifications
    const certificationsRes = await this.query(
      `
      SELECT certification_id, name, issuing_organization, issue_date, expiry_date, credential_id, credential_url, is_verified
      FROM certifications
      WHERE student_id = ?
      ORDER BY (issue_date IS NULL), issue_date DESC, name
      `,
      [id]
    );

    // Publications
    const publicationsRes = await this.query(
      `
      SELECT publication_id, title, authors, journal_conference, publication_date, doi, url, is_verified
      FROM publications
      WHERE student_id = ?
      ORDER BY publication_date DESC
      `,
      [id]
    );

    // Placements summary
    const placementsRes = await this.query(
      `
      SELECT 
        pl.placement_id,
        comp.name AS company_name,
        cjr.title AS job_title,
        pl.status,
        pl.offer_type,
        pl.applied_date,
        pl.offered_date,
        pl.accepted_date
      FROM placements pl
      LEFT JOIN companies comp ON pl.company_id = comp.company_id
      LEFT JOIN company_job_roles cjr ON pl.job_role_id = cjr.job_role_id
      WHERE pl.student_id = ?
      ORDER BY pl.applied_date DESC
      `,
      [id]
    );

    return {
      ...base,
      skills: skillsRes.rows || [],
      interests: interestsRes.rows || [],
      club_memberships: clubsRes.rows || [],
      research_projects: researchRes.rows || [],
      internships: internshipsRes.rows || [],
      achievements: achievementsRes.rows || [],
      certifications: certificationsRes.rows || [],
      publications: publicationsRes.rows || [],
      placements: placementsRes.rows || [],
    };
  }

  // Update student skills
  async updateSkills(studentId, skillIds, proficiencyLevels = []) {
    return await this.transaction(async (client) => {
      // Delete existing skills
      await client.query('DELETE FROM student_skills WHERE student_id = ?', [studentId]);

      // Insert new skills
      if (skillIds && skillIds.length > 0) {
        const values = skillIds.map(() => `(?, ?, ?)`).join(', ');

        const params = skillIds.flatMap((skillId, index) => [
          studentId,
          skillId,
          proficiencyLevels[index] || 'INTERMEDIATE'
        ]);

        await client.query(`
          INSERT INTO student_skills (student_id, skill_id, proficiency_level)
          VALUES ${values}
        `, params);
      }
    });
  }

  // Update student interests
  async updateInterests(studentId, interestIds) {
    return await this.transaction(async (client) => {
      // Delete existing interests
      await client.query('DELETE FROM student_interests WHERE student_id = ?', [studentId]);

      // Insert new interests
      if (interestIds && interestIds.length > 0) {
        const values = interestIds.map(() => `(?, ?)`).join(', ');
        const params = interestIds.flatMap((interestId) => [studentId, interestId]);

        await client.query(`
          INSERT INTO student_interests (student_id, interest_id)
          VALUES ${values}
        `, params);
      }
    });
  }

  // Get students count with filters
  async countByFilters(filters = {}) {
    const {
      q,
      skills,
      interests,
      min_cgpa,
      max_cgpa,
      department_id,
      semester,
      research_experience,
      min_attendance
    } = filters;

    let query = 'SELECT COUNT(DISTINCT s.student_id) as count FROM students s';
    const params = [];
    const conditions = [];

    // Add search query condition (bind four params for MySQL compatibility)
    if (q) {
      const likeVal = `%${q}%`;
      conditions.push('(LOWER(s.first_name) LIKE LOWER(?) OR LOWER(s.last_name) LIKE LOWER(?) OR LOWER(s.email) LIKE LOWER(?) OR LOWER(s.student_id) LIKE LOWER(?))');
      params.push(likeVal, likeVal, likeVal, likeVal);
    }

    // Explicit student_id filter (exact match)
    if (filters.student_id) {
      conditions.push('s.student_id = ?');
      params.push(filters.student_id);
    }

    // Add other conditions (same as findByFilters)
    if (min_cgpa !== undefined) {
      conditions.push('s.cgpa >= ?');
      params.push(min_cgpa);
    }
    if (max_cgpa !== undefined) {
      conditions.push('s.cgpa <= ?');
      params.push(max_cgpa);
    }
    if (department_id) {
      conditions.push('s.department_id = ?');
      params.push(department_id);
    }
    if (semester) {
      conditions.push('s.semester = ?');
      params.push(semester);
    }
    if (research_experience !== undefined) {
      conditions.push('s.research_experience = ?');
      params.push(research_experience);
    }
    if (min_attendance !== undefined) {
      conditions.push('s.attendance_percentage >= ?');
      params.push(min_attendance);
    }

    // Add skills filter
    if (skills) {
      const skillNames = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillNames.length > 0) {
        const placeholders = skillNames.map(() => '?').join(', ');
        conditions.push(`s.student_id IN (
          SELECT ss.student_id 
          FROM student_skills ss 
          JOIN skills sk ON ss.skill_id = sk.skill_id 
          WHERE sk.name IN (${placeholders})
        )`);
        skillNames.forEach(name => params.push(name));
      }
    }

    // Add interests filter
    if (interests) {
      const interestNames = interests.split(',').map(i => i.trim()).filter(Boolean);
      if (interestNames.length > 0) {
        const placeholders = interestNames.map(() => '?').join(', ');
        conditions.push(`s.student_id IN (
          SELECT si.student_id 
          FROM student_interests si 
          JOIN interests i ON si.interest_id = i.interest_id 
          WHERE i.name IN (${placeholders})
        )`);
        interestNames.forEach(name => params.push(name));
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Remove debug logging
    const result = await this.query(query, params);
    return parseInt(result.rows[0].count);
  }
}

module.exports = new StudentsModel();
