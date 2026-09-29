import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDatabase = () => mongoose.connect(env.mongoUri);

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
