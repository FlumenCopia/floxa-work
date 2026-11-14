import mongoose, { ConnectOptions } from 'mongoose';
import { ENV } from './env.js';

let isConnecting = false;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (isConnecting) {
    return mongoose;
  }

  isConnecting = true;

  const options: ConnectOptions = {
    maxPoolSize: ENV.DB_MAX_POOL_SIZE,
    minPoolSize: ENV.DB_MIN_POOL_SIZE,
    serverSelectionTimeoutMS: ENV.DB_SERVER_SELECTION_TIMEOUT_MS,
    connectTimeoutMS: ENV.DB_CONNECT_TIMEOUT_MS,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
  };

  try {
    // Attach connection monitoring listeners
    mongoose.connection.on('connected', () => {
      console.log(`[FLOXA Work] MongoDB Connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('[FLOXA Work] MongoDB Cluster Connection Error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[FLOXA Work] MongoDB Connection Disconnected. Attempting automatic recovery...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[FLOXA Work] MongoDB Connection Re-established.');
    });

    const conn = await mongoose.connect(ENV.DATABASE_URL, options);
    isConnecting = false;
    return conn;
  } catch (error) {
    isConnecting = false;
    console.error('[FLOXA Work] Fatal MongoDB Connection Error:', error);
    throw error;
  }
}

/**
 * Graceful database disconnection for zero-downtime rolling deploys.
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    console.log('[FLOXA Work] Gracefully closing MongoDB connection pool...');
    await mongoose.connection.close(false);
    console.log('[FLOXA Work] MongoDB connection pool closed cleanly.');
  }
}

/**
 * Health check helper returning active connection status and ping latency.
 */
export async function getDatabaseHealth(): Promise<{
  status: 'connected' | 'disconnected' | 'degraded';
  pingMs?: number;
  name?: string;
  error?: string;
}> {
  if (mongoose.connection.readyState !== 1) {
    return { status: 'disconnected', error: 'Database is not connected' };
  }

  try {
    const start = Date.now();
    await mongoose.connection.db?.admin().ping();
    const pingMs = Date.now() - start;
    return {
      status: 'connected',
      pingMs,
      name: mongoose.connection.name,
    };
  } catch (err: any) {
    return {
      status: 'degraded',
      error: err.message || 'Database ping failed',
    };
  }
}
