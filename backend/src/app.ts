import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import router from './routes/index.js';
import { corsOptions, env } from './config/index.js';
import { errorHandler } from './exceptions/index.js';

export const app = express();
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve(env.uploadDir)));
app.use('/api/auth/login', rateLimit({ windowMs: 60_000, limit: 10 }), (_req, _res, next) => next());
app.use('/api', router);
app.use(errorHandler);
