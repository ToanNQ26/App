import type { Response } from 'express';
import type { AuthedRequest } from '../types/index.js';
import * as authService from '../services/auth.service.js';

export async function login(req: AuthedRequest, res: Response) {
  const data = await authService.login(String(req.body.email || ''), String(req.body.password || ''));
  res.json({ success: true, data });
}
export function me(req: AuthedRequest, res: Response) { res.json({ success: true, data: req.user }); }
