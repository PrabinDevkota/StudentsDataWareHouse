const { BaseModel } = require('./index');

class DepartmentsModel extends BaseModel {
  constructor() {
    super('departments');
  }

  // Find all departments
  async findAll() {
    const query = 'SELECT * FROM departments ORDER BY name ASC';
    const result = await this.query(query);
    return result.rows;
  }

  // Find department by ID
  async findById(id) {
    const query = 'SELECT * FROM departments WHERE department_id = ?';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  // Find department by code
  async findByCode(code) {
    const query = 'SELECT * FROM departments WHERE code = ?';
    const result = await this.query(query, [code]);
    return result.rows[0];
  }

  // Create department
  async create(departmentData) {
    const { name, code, description } = departmentData;
    
    const insertSql = `
      INSERT INTO departments (name, code, description)
      VALUES (?, ?, ?)
    `;
    const result = await this.query(insertSql, [name, code, description]);
    const insertedId = result.meta?.insertId;
    if (insertedId) {
      const sel = await this.query('SELECT * FROM departments WHERE department_id = ?', [insertedId]);
      return sel.rows[0];
    }
    const fallback = await this.query('SELECT * FROM departments WHERE code = ?', [code]);
    return fallback.rows[0] || null;
  }

  // Update department
  async update(id, updateData) {
    const { name, code, description } = updateData;
    
    const updateSql = `
      UPDATE departments 
      SET name = COALESCE(?, name),
          code = COALESCE(?, code),
          description = COALESCE(?, description),
          updated_at = CURRENT_TIMESTAMP
      WHERE department_id = ?
    `;
    await this.query(updateSql, [name ?? null, code ?? null, description ?? null, id]);
    const sel = await this.query('SELECT * FROM departments WHERE department_id = ?', [id]);
    return sel.rows[0];
  }

  // Delete department
  async delete(id) {
    const before = await this.query('SELECT * FROM departments WHERE department_id = ?', [id]);
    await this.query('DELETE FROM departments WHERE department_id = ?', [id]);
    return before.rows[0] || null;
  }
}

module.exports = new DepartmentsModel();