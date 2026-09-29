import type { Response } from 'express';
import type { AuthedRequest } from '../types/index.js';
import * as requestService from '../services/request.service.js';
import * as queryService from '../services/query.service.js';

export async function list(req: AuthedRequest, res: Response) {
  const result = await queryService.listRequests(req.user!, req.query);
  res.json({ success: true, ...result });
}
export async function listBookmarked(req: AuthedRequest, res: Response) { res.json({ success: true, data: await queryService.listBookmarkedRequests(req.user!) }); }
export async function bookmark(req: AuthedRequest, res: Response) { res.json({ success: true, data: await queryService.bookmarkRequest(req.user!, req.params.id!) }); }
export async function unbookmark(req: AuthedRequest, res: Response) { res.json({ success: true, data: await queryService.unbookmarkRequest(req.user!, req.params.id!) }); }
export async function exportExcel(req: AuthedRequest, res: Response) {
  const report = await queryService.exportRequestExcel(req.user!, req.params.id!);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${report.filename}"`);
  res.send(report.buffer);
}
export async function get(req: AuthedRequest, res: Response) { res.json({ success: true, data: await queryService.getRequest(req.user!, req.params.id!) }); }
export async function create(req: AuthedRequest, res: Response) { res.status(201).json({ success: true, data: await requestService.createRequest(req.user!, req.body) }); }
export async function update(req: AuthedRequest, res: Response) { res.json({ success: true, data: await requestService.updateDraft(req.user!, req.params.id!, req.body) }); }
export async function submit(req: AuthedRequest, res: Response) { res.json({ success: true, data: await requestService.submitRequest(req.user!, req.params.id!) }); }
