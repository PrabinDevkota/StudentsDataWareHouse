const bcrypt = require('bcrypt');
require('dotenv').config();
const { query, closePool } = require('./src/config/db');

async function createTestUser() {
  try {
    // Student data from the database
    const studentId = '5d6da505-bcb5-479d-a7d6-9eaf6e3acf58';
    const email = 'Loraine.McKenzie28@yahoo.com';
    const password = 'Anissa123'; // Simple password for testing
    const rounds = process.env.BCRYPT_ROUNDS ? Number(process.env.BCRYPT_ROUNDS) : 10;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, rounds);

    // Insert user into database (MySQL)
    const insertSql = `
      INSERT INTO users (email, password_hash, role, profile_type, profile_ref_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        password_hash = VALUES(password_hash),
        role = VALUES(role),
        profile_type = VALUES(profile_type),
        profile_ref_id = VALUES(profile_ref_id),
        is_active = VALUES(is_active),
        updated_at = CURRENT_TIMESTAMP;
    `;

    await query(insertSql, [email, hashedPassword, 'STUDENT', 'STUDENT', studentId, true]);

    const result = await query(
      'SELECT user_id, email, role, profile_type, profile_ref_id FROM users WHERE email = ?',
      [email]
    );

    const user = Array.isArray(result.rows) ? result.rows[0] : result.rows;
    console.log('Test user created/updated successfully:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Student ID:', studentId);
    console.log('User data:', user);

  } catch (error) {
    console.error('Error creating test user:', error.message || error);
  } finally {
    await closePool();
  }
}

createTestUser();