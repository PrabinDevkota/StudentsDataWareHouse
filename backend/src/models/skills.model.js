const { BaseModel } = require('./index');

class SkillsModel extends BaseModel {
  constructor() {
    super('skills');
  }

  // Find skill by name (case insensitive)
  async findByName(name) {
    const query = 'SELECT * FROM skills WHERE LOWER(name) = LOWER(?)';
    const result = await this.query(query, [name]);
    return result.rows[0];
  }

  // Find or create skill
  async findOrCreate(skillData) {
    const existing = await this.findByName(skillData.name);
    if (existing) {
      return existing;
    }
    return await this.create(skillData);
  }

  // Get skills with student count
  async findAllWithStats() {
    const query = `
      SELECT 
        s.*,
        COUNT(ss.student_id) as student_count
      FROM skills s
      LEFT JOIN student_skills ss ON s.skill_id = ss.skill_id
      GROUP BY s.skill_id
      ORDER BY s.name
    `;
    
    const result = await this.query(query);
    return result.rows;
  }

  // Search skills by name
  async searchByName(searchTerm) {
    const query = 'SELECT * FROM skills WHERE name LIKE ? ORDER BY name';
    const result = await this.query(query, [`%${searchTerm}%`]);
    return result.rows;
  }
}

module.exports = new SkillsModel();
