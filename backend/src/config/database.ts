import mongoose from 'mongoose';
import { ENV } from './env.js';

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    const conn = await mongoose.connect(ENV.DATABASE_URL);
    console.log(`[FLOXA Work] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('[FLOXA Work] MongoDB Connection Error:', error);
    throw error;
  }
}

