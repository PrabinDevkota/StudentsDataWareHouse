require('dotenv').config();

const config = {
  
  // Server
  server: {
    port: parseInt(process.env.PORT) || 4001,
    env: process.env.NODE_ENV || 'development',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    expiresIn: '24h',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png').split(','),
    avatarPath: 'uploads/avatars',
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
};

// Validate required environment variables
// Allow either a single URL (MYSQL_URL) or discrete MySQL settings
const hasMysqlUrl = !!process.env.MYSQL_URL;
const hasDiscreteMysql = !!(
  process.env.MYSQL_HOST &&
  process.env.MYSQL_PORT &&
  process.env.MYSQL_USER &&
  process.env.MYSQL_PASSWORD !== undefined &&
  process.env.MYSQL_DATABASE
);

const hasDbConfig = hasMysqlUrl || hasDiscreteMysql;

const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (!hasDbConfig || missingEnvVars.length > 0) {
  const missing = [...missingEnvVars];
  if (!hasDbConfig) {
    missing.push('MYSQL_URL or MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE');
  }
  console.error('Missing required environment variables:', missing);
  console.error('Please check your .env file or environment configuration');
  process.exit(1);
}

module.exports = config;
