const { BaseModel } = require('./index');

class InterestsModel extends BaseModel {
  constructor() {
    super('interests');
  }

  // Find interest by name (case insensitive)
  async findByName(name) {
    const query = 'SELECT * FROM interests WHERE LOWER(name) = LOWER(?)';
    const result = await this.query(query, [name]);
    return result.rows[0];
  }

  // Find or create interest
  async findOrCreate(interestData) {
    const existing = await this.findByName(interestData.name);
    if (existing) {
      return existing;
    }
    return await this.create(interestData);
  }

  // Get interests with student count
  async findAllWithStats() {
    const query = `
      SELECT 
        i.*,
        COUNT(si.student_id) as student_count
      FROM interests i
      LEFT JOIN student_interests si ON i.interest_id = si.interest_id
      GROUP BY i.interest_id
      ORDER BY i.name
    `;
    
    const result = await this.query(query);
    return result.rows;
  }

  // Search interests by name
  async searchByName(searchTerm) {
    const query = 'SELECT * FROM interests WHERE LOWER(name) LIKE LOWER(?) ORDER BY name';
    const result = await this.query(query, [`%${searchTerm}%`]);
    return result.rows;
  }
}

module.exports = new InterestsModel();
