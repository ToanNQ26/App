import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from '../types/index.js';
import { AppError } from './app-error.exception.js';

export function errorHandler(error: unknown, _req: AuthedRequest, res: Response, _next: NextFunction) {
  const appError = error instanceof AppError ? error : null;
  const status = appError?.status ?? 500;
  if (!appError) console.error(error);
  res.status(status).json({
    success: false,
    error: {
      code: appError?.code ?? 'INTERNAL_SERVER_ERROR',
      message: appError?.message ?? 'Đã xảy ra lỗi hệ thống',
      details: appError?.details ?? null
    }
  });
}
