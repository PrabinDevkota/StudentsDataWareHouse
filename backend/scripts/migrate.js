const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../src/config/env');
const logger = require('../src/utils/logger');

// Database connection
const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.server.env === 'production' ? { rejectUnauthorized: false } : false
});

// Get migration files
const getMigrationFiles = () => {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .map(file => ({
      name: file,
      path: path.join(migrationsDir, file)
    }));
};

// Check if migration has been run
const isMigrationRun = async (migrationName) => {
  try {
    const result = await pool.query(
      'SELECT id FROM migration_logs WHERE migration_name = $1 AND status = $2',
      [migrationName, 'SUCCESS']
    );
    return result.rows.length > 0;
  } catch (error) {
    // If migration_logs table doesn't exist, assume no migrations have been run
    return false;
  }
};

// Run migration
const runMigration = async (migration) => {
  const startTime = Date.now();
  
  try {
    logger.info(`Running migration: ${migration.name}`);
    
    // Read migration file
    const sql = fs.readFileSync(migration.path, 'utf8');
    
    // Execute migration
    await pool.query(sql);
    
    const duration = Date.now() - startTime;
    
    // Log successful migration
    await pool.query(
      'INSERT INTO migration_logs (migration_name, status, execution_time_ms) VALUES ($1, $2, $3)',
      [migration.name, 'SUCCESS', duration]
    );
    
    logger.info(`Migration completed: ${migration.name} (${duration}ms)`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log failed migration
    await pool.query(
      'INSERT INTO migration_logs (migration_name, status, error_message, execution_time_ms) VALUES ($1, $2, $3, $4)',
      [migration.name, 'FAILED', error.message, duration]
    );
    
    logger.error(`Migration failed: ${migration.name}`, error);
    return false;
  }
};

// Main migration function
const migrate = async () => {
  try {
    logger.info('Starting database migration...');
    
    const migrations = getMigrationFiles();
    logger.info(`Found ${migrations.length} migration files`);
    
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    
    for (const migration of migrations) {
      const isRun = await isMigrationRun(migration.name);
      
      if (isRun) {
        logger.info(`Skipping already run migration: ${migration.name}`);
        skipCount++;
        continue;
      }
      
      const success = await runMigration(migration);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
        logger.error(`Stopping migration due to failure in: ${migration.name}`);
        break;
      }
    }
    
    logger.info('Migration completed:', {
      successful: successCount,
      skipped: skipCount,
      failed: failCount,
      total: migrations.length
    });
    
    if (failCount > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    logger.error('Migration process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run migrations if this script is executed directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };
