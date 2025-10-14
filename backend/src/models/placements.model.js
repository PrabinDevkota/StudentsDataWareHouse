const { BaseModel } = require('./index');

class PlacementsModel extends BaseModel {
  constructor() {
    super('placements');
  }

  // Get placements with student and company details
  async findAllWithDetails(filters = {}, pagination = {}) {
    const {
      student_id,
      company_id,
      job_role_id,
      status,
      page = 1,
      limit = 20,
      sort = 'applied_date',
      order = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    let query = `
      SELECT 
        p.*,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        s.email as student_email,
        d.name as department_name,
        c.name as company_name,
        cjr.title as job_title,
        cjr.description as job_description,
        cjr.salary_range,
        cjr.location as job_location
      FROM placements p
      LEFT JOIN students s ON p.student_id = s.student_id
      LEFT JOIN departments d ON s.department_id = d.department_id
      LEFT JOIN companies c ON p.company_id = c.company_id
      LEFT JOIN company_job_roles cjr ON p.job_role_id = cjr.job_role_id
    `;

    // Add filters
    if (student_id) {
      conditions.push(`p.student_id = ?`);
      params.push(student_id);
    }

    if (company_id) {
      conditions.push(`p.company_id = ?`);
      params.push(company_id);
    }

    if (job_role_id) {
      conditions.push(`p.job_role_id = ?`);
      params.push(job_role_id);
    }

    if (status) {
      conditions.push(`p.status = ?`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY p.${sort} ${order}`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await this.query(query, params);
    return result.rows;
  }

  // Get placement by ID with full details
  async getByIdWithDetails(id) {
    const query = `
      SELECT 
        p.*,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        s.email as student_email,
        s.phone as student_phone,
        s.cgpa,
        s.attendance_percentage,
        d.name as department_name,
        d.code as department_code,
        c.name as company_name,
        c.website as company_website,
        c.industry as company_industry,
        cjr.title as job_title,
        cjr.description as job_description,
        cjr.requirements as job_requirements,
        cjr.salary_range,
        cjr.location as job_location
      FROM placements p
      LEFT JOIN students s ON p.student_id = s.student_id
      LEFT JOIN departments d ON s.department_id = d.department_id
      LEFT JOIN companies c ON p.company_id = c.company_id
      LEFT JOIN company_job_roles cjr ON p.job_role_id = cjr.job_role_id
      WHERE p.placement_id = ?
    `;

    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  // Update placement status (supports offer_type and offered/accepted dates)
  async updateStatus(id, status, acceptedDate = null, offerType = null, offeredDate = null) {
    const updateData = { status };

    if (offerType) {
      updateData.offer_type = offerType;
    }

    if (status === 'OFFERED' && offeredDate) {
      updateData.offered_date = offeredDate;
    }

    if (status === 'ACCEPTED' && acceptedDate) {
      updateData.accepted_date = acceptedDate;
    }

    return await this.update(id, updateData);
  }

  // Get placement statistics
  async getStatistics() {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM placements
      GROUP BY status
      ORDER BY count DESC
    `;

    const result = await this.query(query);
    return result.rows;
  }

  // Get placements by status
  async findByStatus(status) {
    const query = `
      SELECT 
        p.*,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        c.name as company_name,
        cjr.title as job_title
      FROM placements p
      LEFT JOIN students s ON p.student_id = s.student_id
      LEFT JOIN companies c ON p.company_id = c.company_id
      LEFT JOIN company_job_roles cjr ON p.job_role_id = cjr.job_role_id
      WHERE p.status = ?
      ORDER BY p.applied_date DESC
    `;

    const result = await this.query(query, [status]);
    return result.rows;
  }

  // Get placements count with filters
  async countByFilters(filters = {}) {
    const { student_id, company_id, job_role_id, status } = filters;
    
    let query = 'SELECT COUNT(*) as count FROM placements p';
    const params = [];
    const conditions = [];

    if (student_id) {
      conditions.push(`p.student_id = ?`);
      params.push(student_id);
    }

    if (company_id) {
      conditions.push(`p.company_id = ?`);
      params.push(company_id);
    }

    if (job_role_id) {
      conditions.push(`p.job_role_id = ?`);
      params.push(job_role_id);
    }

    if (status) {
      conditions.push(`p.status = ?`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await this.query(query, params);
    return parseInt(result.rows[0].count);
  }
}

module.exports = new PlacementsModel();
