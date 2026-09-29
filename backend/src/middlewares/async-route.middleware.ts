import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from '../types/index.js';

export const asyncRoute = (handler: Function) => (req: AuthedRequest, res: Response, next: NextFunction) =>
  Promise.resolve(handler(req, res, next)).catch(next);
