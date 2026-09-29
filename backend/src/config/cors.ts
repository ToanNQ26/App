import type { CorsOptions } from 'cors';
import { env } from './env.js';

const configuredOrigins = env.frontendUrl.split(',').map(origin => origin.trim()).filter(Boolean);

function isAllowedOrigin(origin?: string) {
  if (!origin || configuredOrigins.includes(origin)) return true;
  try {
    const url = new URL(origin);
    return env.nodeEnv !== 'production' && ['localhost', '127.0.0.1'].includes(url.hostname) && ['5173', '5174', '5175'].includes(url.port);
  } catch {
    return false;
  }
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => isAllowedOrigin(origin) ? callback(null, true) : callback(new Error('Origin không được CORS cho phép'))
};

// export const corsOptions: CorsOptions = {
//   origin: (_origin, callback) => callback(null, true),
// };