import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',

  database: {
    url: process.env.DATABASE_URL || '',
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
    poolIdleTimeout: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || '10000', 10),
    connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '5000', 10),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '24h',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    enabled: process.env.REDIS_ENABLED === 'true',
  },

  storage: {
    type: process.env.STORAGE_TYPE || 's3',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'ap-south-2',
    bucketName: process.env.AWS_BUCKET_NAME || '',
    endpoint: process.env.AWS_ENDPOINT || undefined,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:5174',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
    bypassInDev: process.env.RATE_LIMIT_BYPASS_DEV === 'true',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'dev',
    sqlQueries: process.env.LOG_SQL_QUERIES === 'true',
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400000', 10),
  },
};

// Validation
if (!config.database.url) {
  throw new Error('DATABASE_URL is required');
}

if (!config.jwt.accessSecret || !config.jwt.refreshSecret) {
  throw new Error('JWT secrets are required');
}
