const { BaseModel } = require('./index');

class CompaniesModel extends BaseModel {
  constructor() {
    super('companies');
  }

  // Find company by name
  async findByName(name) {
    const query = 'SELECT * FROM companies WHERE LOWER(name) = LOWER(?)';
    const result = await this.query(query, [name]);
    return result.rows[0];
  }

  // Get companies with job roles
  async findAllWithJobRoles() {
    const query = `
      SELECT 
        c.*,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(JSON_OBJECT(
              'job_role_id', jr.job_role_id,
              'title', jr.title,
              'description', jr.description,
              'requirements', jr.requirements,
              'salary_range', jr.salary_range,
              'location', jr.location,
              'role_type', jr.role_type,
              'is_active', jr.is_active
            ))
            FROM company_job_roles jr
            WHERE jr.company_id = c.company_id
          ), JSON_ARRAY()
        ) AS job_roles
      FROM companies c
      GROUP BY c.company_id
      ORDER BY c.name
    `;
    
    const result = await this.query(query);
    return result.rows;
  }

  // Get company by ID with full details
  async getByIdWithDetails(id) {
    const query = `
      SELECT 
        c.*,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(JSON_OBJECT(
              'job_role_id', jr.job_role_id,
              'title', jr.title,
              'description', jr.description,
              'requirements', jr.requirements,
              'salary_range', jr.salary_range,
              'location', jr.location,
              'role_type', jr.role_type,
              'is_active', jr.is_active,
              'created_at', jr.created_at
            ))
            FROM company_job_roles jr
            WHERE jr.company_id = c.company_id
          ), JSON_ARRAY()
        ) AS job_roles,
        COUNT(DISTINCT p.placement_id) as total_placements,
        COUNT(DISTINCT CASE WHEN p.status = 'ACCEPTED' THEN p.placement_id END) as accepted_placements
      FROM companies c
      LEFT JOIN placements p ON c.company_id = p.company_id
      WHERE c.company_id = ?
      GROUP BY c.company_id
    `;

    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  // Search companies by name or industry
  async search(searchTerm) {
    const query = `
      SELECT * FROM companies 
      WHERE LOWER(name) LIKE LOWER(?) OR LOWER(industry) LIKE LOWER(?) OR LOWER(location) LIKE LOWER(?)
      ORDER BY name
    `;
    const like = `%${searchTerm}%`;
    const result = await this.query(query, [like, like, like]);
    return result.rows;
  }
}

module.exports = new CompaniesModel();
