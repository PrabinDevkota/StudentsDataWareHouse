const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Build MySQL pool configuration
const connectionString = process.env.MYSQL_URL || process.env.DATABASE_URL || null;
let pool;
let mysqlConfig;
if (connectionString) {
  pool = mysql.createPool(connectionString);
} else {
  mysqlConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'student_dw',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
  pool = mysql.createPool(mysqlConfig);
}

// Convert PostgreSQL-style placeholders and keywords to MySQL-compatible
function normalizeSql(text) {
  let sql = text;
  // $1, $2 -> ?
  sql = sql.replace(/\$(\d+)/g, '?');
  // ILIKE -> LIKE (MySQL text comparisons are case-insensitive under default collations)
  sql = sql.replace(/\bILIKE\b/gi, 'LIKE');
  return sql;
}

// Test database connection
const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    logger.info('MySQL database connected successfully');
    return true;
  } catch (err) {
    if ((err.code === 'ER_BAD_DB_ERROR' || err.errno === 1049) && mysqlConfig?.database) {
      try {
        logger.warn(`Database '${mysqlConfig.database}' not found. Creating...`);
        const tempConfig = { ...mysqlConfig };
        delete tempConfig.database;
        const tempConn = await mysql.createConnection(tempConfig);
        await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${mysqlConfig.database}\``);
        await tempConn.end();
        logger.info(`Database '${mysqlConfig.database}' ensured.`);
        // Retry once
        const conn2 = await pool.getConnection();
        await conn2.query('SELECT 1');
        conn2.release();
        logger.info('MySQL database connected successfully after creating database');
        return true;
      } catch (createErr) {
        logger.error('Failed to create database:', createErr);
        return false;
      }
    }
    logger.error('MySQL database connection failed:', err);
    return false;
  }
};

// Execute query with error handling. Returns { rows, meta }
const query = async (text, params = []) => {
  const start = Date.now();
  const sql = normalizeSql(text);
  try {
    const [rows, meta] = await pool.query(sql, params);
    const duration = Date.now() - start;
    const rowCount = Array.isArray(rows) ? rows.length : meta?.affectedRows || 0;
    logger.debug('Executed query', { text: sql, duration, rows: rowCount });
    return { rows, meta };
  } catch (err) {
    logger.error('Query execution failed', { text: sql, params, error: err.message });
    throw err;
  }
};

// Execute transaction using a dedicated connection
const transaction = async (callback) => {
  const conn = await pool.getConnection();
  const client = {
    // Emulate pg client.query API
    query: async (text, params = []) => {
      const sql = normalizeSql(text);
      const [rows, meta] = await conn.query(sql, params);
      return { rows, meta };
    },
  };

  try {
    await conn.beginTransaction();
    const result = await callback(client);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// Close pool
const closePool = async () => {
  await pool.end();
  logger.info('MySQL database pool closed');
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  closePool,
};
