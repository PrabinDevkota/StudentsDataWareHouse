const db = require('../config/db');
const logger = require('../utils/logger');

// Base model class with common database operations
class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  // Derive primary key column from table name with pluralization handling
  getPrimaryKey() {
    const name = this.tableName;
    if (name.endsWith('ies')) {
      // companies -> company_id
      return `${name.slice(0, -3)}y_id`;
    }
    if (name.endsWith('s')) {
      // students -> student_id, interests -> interest_id
      return `${name.slice(0,  -1)}_id`;
    }
    // singular table names like faculty -> faculty_id
    return `${name}_id`;
  }

  // Find all records with optional filters and pagination
  async findAll(filters = {}, pagination = {}) {
    const { page = 1, limit = 20, sort = 'created_at', order = 'DESC' } = pagination;
    const offset = (page - 1) * limit;
    
    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];

    // Add WHERE conditions
    const conditions = [];
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add ORDER BY
    query += ` ORDER BY ${sort} ${order}`;

    // Add LIMIT and OFFSET
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    return result.rows;
  }

  // Find by ID
  async findById(id) {
    const pk = this.getPrimaryKey();
    const query = `SELECT * FROM ${this.tableName} WHERE ${pk} = ?`;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Create new record
  async create(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map(() => '?');

    const insertSql = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
    `;

    const insertResult = await db.query(insertSql, values);
    const pk = this.getPrimaryKey();

    // Try to fetch inserted row: prefer insertId, otherwise use provided PK
    let insertedRow = null;
    const insertId = insertResult.meta && insertResult.meta.insertId;
    if (insertId) {
      const sel = await db.query(`SELECT * FROM ${this.tableName} WHERE ${pk} = ?`, [insertId]);
      insertedRow = sel.rows[0] || null;
    } else if (data[pk] !== undefined) {
      const sel = await db.query(`SELECT * FROM ${this.tableName} WHERE ${pk} = ?`, [data[pk]]);
      insertedRow = sel.rows[0] || null;
    }
    return insertedRow || { ...data };
  }

  // Update record by ID
  async update(id, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const sets = columns.map((col) => `${col} = ?`).join(', ');

    const updateSql = `
      UPDATE ${this.tableName}
      SET ${sets}
      WHERE ${this.getPrimaryKey()} = ?
    `;

    await db.query(updateSql, [...values, id]);
    const result = await db.query(`SELECT * FROM ${this.tableName} WHERE ${this.getPrimaryKey()} = ?`, [id]);
    return result.rows[0];
  }

  // Delete record by ID
  async delete(id) {
    const pk = this.getPrimaryKey();
    const before = await db.query(`SELECT * FROM ${this.tableName} WHERE ${pk} = ?`, [id]);
    await db.query(`DELETE FROM ${this.tableName} WHERE ${pk} = ?`, [id]);
    return before.rows[0] || null;
  }

  // Count records with filters
  async count(filters = {}) {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];

    const conditions = [];
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  // Execute raw query
  async query(text, params = []) {
    return await db.query(text, params);
  }

  // Execute transaction
  async transaction(callback) {
    return await db.transaction(callback);
  }
}

// Export database connection and base model
module.exports = {
  db,
  BaseModel
};
