import type { Response } from 'express';
import type { AuthedRequest } from '../types/index.js';
import * as queryService from '../services/query.service.js';

export async function history(req: AuthedRequest, res: Response) { res.json({ success: true, data: await queryService.getHistory(req.user!, req.params.id!) }); }
export async function disbursements(req: AuthedRequest, res: Response) { res.json({ success: true, data: await queryService.getDisbursements(req.user!, req.params.id!) }); }
