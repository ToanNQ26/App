import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/index.js';
import { AppError } from '../exceptions/index.js';
import type { AuthedRequest, AuthUser } from '../types/index.js';

export function authenticate(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/, '');
    if (!token) throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập');
    req.user = jwt.verify(token, env.jwtSecret) as AuthUser;
    next();
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ'));
  }
}
