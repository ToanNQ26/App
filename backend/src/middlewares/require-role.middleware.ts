import type { NextFunction, Response } from 'express';
import type { Role } from '../enums/index.js';
import { AppError } from '../exceptions/index.js';
import type { AuthedRequest } from '../types/index.js';

export const requireRoles = (...roles: Role[]) => (req: AuthedRequest, _res: Response, next: NextFunction) =>
  roles.includes(req.user!.role) ? next() : next(new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này'));
