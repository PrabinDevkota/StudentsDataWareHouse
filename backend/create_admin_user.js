const bcrypt = require('bcrypt');
require('dotenv').config();
const { query, closePool } = require('./src/config/db');

async function createAdminUser() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const role = 'ADMIN';
    const rounds = process.env.BCRYPT_ROUNDS ? Number(process.env.BCRYPT_ROUNDS) : 10;

    // Hash the password
    const passwordHash = await bcrypt.hash(password, rounds);

    // Insert or update admin user (MySQL)
    const insertSql = `
      INSERT INTO users (email, password_hash, role, profile_type, profile_ref_id, is_active)
      VALUES (?, ?, ?, ?, UUID(), ?)
      ON DUPLICATE KEY UPDATE
        password_hash = VALUES(password_hash),
        role = VALUES(role),
        profile_type = VALUES(profile_type),
        is_active = VALUES(is_active),
        updated_at = CURRENT_TIMESTAMP;
    `;

    await query(insertSql, [email, passwordHash, role, 'ADMIN', true]);

    const result = await query(
      'SELECT user_id, email, role, profile_type, is_active FROM users WHERE email = ?',
      [email]
    );

    const user = Array.isArray(result.rows) ? result.rows[0] : result.rows;
    console.log('Admin user created/updated successfully:');
    console.log({ ...user, email });
    if (!process.env.ADMIN_PASSWORD) {
      console.log('Note: No ADMIN_PASSWORD provided; default "admin123" was used.');
    }
  } catch (error) {
    console.error('Error creating admin user:', error.message || error);
  } finally {
    await closePool();
  }
}

createAdminUser();