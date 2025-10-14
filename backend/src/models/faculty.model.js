const { BaseModel } = require('./index');

class FacultyModel extends BaseModel {
  constructor() {
    super('faculty');
  }

  // Find faculty by email
  async findByEmail(email) {
    const query = 'SELECT * FROM faculty WHERE email = ?';
    const result = await this.query(query, [email]);
    return result.rows[0];
  }

  // Get faculty with department information
  async findAllWithDepartment() {
    const query = `
      SELECT 
        f.*,
        d.name as department_name,
        d.code as department_code
      FROM faculty f
      LEFT JOIN departments d ON f.department_id = d.department_id
      ORDER BY f.first_name, f.last_name
    `;
    
    const result = await this.query(query);
    return result.rows;
  }

  // Find faculty with filters and pagination
  async findByFilters(filters = {}) {
    const {
      q,
      department_id,
      page = 1,
      limit = 10
    } = filters;
    // Ensure numeric values for LIMIT/OFFSET (MySQL rejects quoted strings)
    const limitNum = Number.parseInt(limit, 10) || 10;
    const pageNum = Number.parseInt(page, 10) || 1;
    const offset = (pageNum - 1) * limitNum;
    const params = [];
    const conditions = [];

    let query = `
      SELECT 
        f.*,
        d.name as department_name,
        d.code as department_code
      FROM faculty f
      LEFT JOIN departments d ON f.department_id = d.department_id
    `;

    if (q) {
      conditions.push(`(LOWER(f.first_name) LIKE LOWER(?) OR LOWER(f.last_name) LIKE LOWER(?) OR LOWER(f.email) LIKE LOWER(?))`);
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (department_id) {
      conditions.push(`f.department_id = ?`);
      params.push(department_id);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Order, limit, and offset
    query += ` ORDER BY f.first_name, f.last_name LIMIT ?`;
    params.push(limitNum);

    query += ` OFFSET ?`;
    params.push(offset);

    const result = await this.query(query, params);
    return result.rows;
  }

  // Count faculty matching filters
  async countByFilters(filters = {}) {
    const { q, department_id } = filters;

    const params = [];
    const conditions = [];

    let query = `
      SELECT COUNT(*) AS total
      FROM faculty f
    `;

    if (q) {
      conditions.push(`(LOWER(f.first_name) LIKE LOWER(?) OR LOWER(f.last_name) LIKE LOWER(?) OR LOWER(f.email) LIKE LOWER(?))`);
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (department_id) {
      conditions.push(`f.department_id = ?`);
      params.push(department_id);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await this.query(query, params);
    return parseInt(result.rows[0].total, 10);
  }

  // Get faculty by ID with research projects
  async getByIdWithRelations(id) {
    const query = `
      SELECT 
        f.*,
        d.name as department_name,
        d.code as department_code,
        d.description as department_description,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'project_id', rp2.project_id,
                'title', rp2.title,
                'description', rp2.description,
                'start_date', rp2.start_date,
                'end_date', rp2.end_date,
                'status', rp2.status,
                'participant_count', (
                  SELECT COUNT(*) FROM research_project_participants rpp WHERE rpp.project_id = rp2.project_id
                )
              )
            )
            FROM research_projects rp2
            WHERE rp2.faculty_id = f.faculty_id
          ), JSON_ARRAY()
        ) AS research_projects
      FROM faculty f
      LEFT JOIN departments d ON f.department_id = d.department_id
      WHERE f.faculty_id = ?
      GROUP BY f.faculty_id, d.department_id
    `;

    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  // Get faculty by department
  async findByDepartment(departmentId) {
    const query = `
      SELECT 
        f.*,
        d.name as department_name,
        d.code as department_code
      FROM faculty f
      LEFT JOIN departments d ON f.department_id = d.department_id
      WHERE f.department_id = ?
      ORDER BY f.first_name, f.last_name
    `;
    
    const result = await this.query(query, [departmentId]);
    return result.rows;
  }

  // Override update to use correct primary key column and safe COALESCE
  async update(id, updateData = {}) {
    const {
      first_name,
      last_name,
      email,
      phone,
      department_id,
      designation,
      specialization,
      avatar_path,
    } = updateData;

    const query = `
      UPDATE faculty
      SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        department_id = COALESCE(?, department_id),
        designation = COALESCE(?, designation),
        specialization = COALESCE(?, specialization),
        avatar_path = COALESCE(?, avatar_path),
        updated_at = CURRENT_TIMESTAMP
      WHERE faculty_id = ?
    `;

    const params = [
      first_name ?? null,
      last_name ?? null,
      email ?? null,
      phone ?? null,
      department_id ?? null,
      designation ?? null,
      specialization ?? null,
      avatar_path ?? null,
      id,
    ];

    await this.query(query, params);
    const sel = await this.query('SELECT * FROM faculty WHERE faculty_id = ?', [id]);
    return sel.rows[0];
  }

  // Override findById to use correct primary key column
  async findById(id) {
    const query = 'SELECT * FROM faculty WHERE faculty_id = ?';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  // Override delete to use correct primary key column
  async delete(id) {
    const before = await this.query('SELECT * FROM faculty WHERE faculty_id = ?', [id]);
    await this.query('DELETE FROM faculty WHERE faculty_id = ?', [id]);
    return before.rows[0] || null;
  }
}

module.exports = new FacultyModel();
