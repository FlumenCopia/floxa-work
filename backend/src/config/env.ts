import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Insecure development fallback keys that must NEVER be used in production
const INSECURE_FALLBACKS = new Set([
  'floxa_work_default_access_secret_key',
  'floxa_work_default_refresh_secret_key',
  'floxa_work_access_super_secret_jwt_key_2026',
  'floxa_work_refresh_super_secret_jwt_key_2026',
  'secret',
  'changeme',
]);

const rawAccessSecret = process.env.JWT_ACCESS_SECRET || (isProduction ? '' : 'floxa_work_default_access_secret_key');
const rawRefreshSecret = process.env.JWT_REFRESH_SECRET || (isProduction ? '' : 'floxa_work_default_refresh_secret_key');

// Production Fail-Fast Validation
if (isProduction) {
  const missingSecrets: string[] = [];

  if (!rawAccessSecret || INSECURE_FALLBACKS.has(rawAccessSecret) || rawAccessSecret.length < 32) {
    missingSecrets.push('JWT_ACCESS_SECRET (must be unique, cryptographically random, min 32 chars)');
  }

  if (!rawRefreshSecret || INSECURE_FALLBACKS.has(rawRefreshSecret) || rawRefreshSecret.length < 32) {
    missingSecrets.push('JWT_REFRESH_SECRET (must be unique, cryptographically random, min 32 chars)');
  }

  if (!process.env.DATABASE_URL) {
    missingSecrets.push('DATABASE_URL');
  }

  if (missingSecrets.length > 0) {
    console.error('\n========================================================================');
    console.error(' [FATAL CONFIGURATION ERROR] Production startup aborted!');
    console.error(' The following mandatory production environment settings are missing or insecure:');
    missingSecrets.forEach((s) => console.error(`  - ${s}`));
    console.error('========================================================================\n');
    throw new Error(`Production configuration validation failed: ${missingSecrets.join('; ')}`);
  }
}

export const ENV = {
  PORT: parseInt(process.env.PORT || '5001', 10),
  NODE_ENV,
  IS_PRODUCTION: isProduction,
  TRUST_PROXY: process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true',
  
  // Database Pool & Timeout Settings
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/floxa_work_db',
  DB_MAX_POOL_SIZE: parseInt(process.env.DB_MAX_POOL_SIZE || '25', 10), // Lean pool size protects shared MongoDB Atlas connection limits
  DB_MIN_POOL_SIZE: parseInt(process.env.DB_MIN_POOL_SIZE || '2', 10),
  DB_SERVER_SELECTION_TIMEOUT_MS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT_MS || '5000', 10),
  DB_CONNECT_TIMEOUT_MS: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '10000', 10),

  // Authentication & Cryptographic Secrets
  JWT_ACCESS_SECRET: rawAccessSecret,
  JWT_REFRESH_SECRET: rawRefreshSecret,
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

  // Network & CORS
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // Storage Abstraction
  STORAGE_PROVIDER: (process.env.STORAGE_PROVIDER || 'local') as 'local' | 's3',
  STORAGE_LOCAL_PATH: process.env.STORAGE_LOCAL_PATH || 'media/private_vault/',
  MEDIA_ROOT: process.env.MEDIA_ROOT || 'media/',
  S3_ENDPOINT: process.env.S3_ENDPOINT || '',
  S3_BUCKET: process.env.S3_BUCKET || '',
  S3_REGION: process.env.S3_REGION || 'auto',
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || '',
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || '',

  // Email Delivery
  EMAIL_PROVIDER: (process.env.EMAIL_PROVIDER || 'log') as 'log' | 'smtp' | 'sendgrid' | 'resend',
  EMAIL_FROM: process.env.EMAIL_FROM || 'FLOXA Work <no-reply@floxa.work>',
  SMTP_HOST: process.env.SMTP_HOST || 'localhost',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',

  // WebRTC / STUN / TURN
  STUN_SERVERS: (process.env.STUN_SERVERS || 'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302')
    .split(',')
    .map((s) => s.trim()),
  TURN_SERVER_URL: process.env.TURN_SERVER_URL || '',
  TURN_USERNAME: process.env.TURN_USERNAME || '',
  TURN_CREDENTIAL: process.env.TURN_CREDENTIAL || '',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  AUTH_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '20', 10),

  // Third-Party Integrations (Optional)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
};

/**
 * Returns a sanitized copy of the runtime environment without exposing passwords,
 * cryptographic keys, or private API credentials.
 */
export function getSafeRuntimeConfig() {
  return {
    nodeEnv: ENV.NODE_ENV,
    port: ENV.PORT,
    trustProxy: ENV.TRUST_PROXY,
    corsOrigins: ENV.CORS_ORIGIN,
    storageProvider: ENV.STORAGE_PROVIDER,
    emailProvider: ENV.EMAIL_PROVIDER,
    database: {
      urlRedacted: ENV.DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
      maxPoolSize: ENV.DB_MAX_POOL_SIZE,
      minPoolSize: ENV.DB_MIN_POOL_SIZE,
    },
    auth: {
      accessExpiry: ENV.JWT_ACCESS_EXPIRY,
      refreshExpiry: ENV.JWT_REFRESH_EXPIRY,
      accessSecretConfigured: Boolean(ENV.JWT_ACCESS_SECRET),
      refreshSecretConfigured: Boolean(ENV.JWT_REFRESH_SECRET),
    },
  };
}
