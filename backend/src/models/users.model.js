const { BaseModel } = require('./index');
const bcrypt = require('bcrypt');
const config = require('../config/env');

class UsersModel extends BaseModel {
  constructor() {
    super('users');
  }

  // Find user by email
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const result = await this.query(query, [email]);
    return result.rows[0];
  }

  // Create user with hashed password
  async createUser(userData) {
    const { email, password, role, profile_type, profile_ref_id } = userData;
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);
    
    const userDataWithHash = {
      email,
      password_hash: passwordHash,
      role,
      profile_type,
      profile_ref_id
    };

    return await this.create(userDataWithHash);
  }

  // Verify password
  async verifyPassword(email, password) {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    return isValid ? user : null;
  }

  // Verify student credentials (email + name)
  async verifyStudentCredentials(email, name) {
    const query = `
      SELECT u.*, s.first_name, s.last_name 
      FROM users u
      JOIN students s ON u.profile_ref_id = s.student_id
      WHERE u.email = ? AND u.profile_type = 'STUDENT'
    `;
    const result = await this.query(query, [email]);
    const user = result.rows[0];
    
    if (!user) {
      return null;
    }

    // Check if the provided name matches the student's name
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const providedName = name.toLowerCase();
    
    // Allow both full name and just first name
    const isValid = fullName === providedName || user.first_name.toLowerCase() === providedName;
    return isValid ? user : null;
  }

  // Update password
  async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    return await this.update(userId, { password_hash: passwordHash });
  }

  // Update last login
  async updateLastLogin(userId) {
    return await this.update(userId, { last_login: new Date() });
  }

  // Get user with profile details
  async getUserWithProfile(userId) {
    const query = `
      SELECT 
        u.*,
        CASE 
          WHEN u.profile_type = 'STUDENT' THEN 
            JSON_OBJECT(
              'profile_id', s.student_id,
              'first_name', s.first_name,
              'last_name', s.last_name
            )
          WHEN u.profile_type = 'FACULTY' THEN 
            JSON_OBJECT(
              'profile_id', f.faculty_id,
              'first_name', f.first_name,
              'last_name', f.last_name,
              'designation', f.designation
            )
          WHEN u.profile_type = 'CLUB' THEN 
            JSON_OBJECT(
              'profile_id', c.club_id,
              'name', c.name,
              'category', c.category
            )
          ELSE NULL
        END as profile
      FROM users u
      LEFT JOIN students s ON u.profile_type = 'STUDENT' AND u.profile_ref_id = s.student_id
      LEFT JOIN faculty f ON u.profile_type = 'FACULTY' AND u.profile_ref_id = f.faculty_id
      LEFT JOIN clubs c ON u.profile_type = 'CLUB' AND u.profile_ref_id = c.club_id
      WHERE u.user_id = ?
    `;

    const result = await this.query(query, [userId]);
    return result.rows[0];
  }

  // Get users by role
  async findByRole(role) {
    const query = 'SELECT * FROM users WHERE role = ? ORDER BY created_at DESC';
    const result = await this.query(query, [role]);
    return result.rows;
  }

  // Deactivate user
  async deactivate(userId) {
    return await this.update(userId, { is_active: false });
  }

  // Activate user
  async activate(userId) {
    return await this.update(userId, { is_active: true });
  }
}

module.exports = new UsersModel();
