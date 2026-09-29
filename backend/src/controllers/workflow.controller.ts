import type { Response } from 'express';
import type { AuthedRequest } from '../types/index.js';
import * as workflowService from '../services/workflow.service.js';
import * as queryService from '../services/query.service.js';

export async function pending(req: AuthedRequest, res: Response) { res.json({ success: true, data: await queryService.getPendingApprovals(req.user!) }); }
export async function approve(req: AuthedRequest, res: Response) { res.json({ success: true, data: await workflowService.decideRequest(req.user!, req.params.id!, true, req.body.comment) }); }
export async function reject(req: AuthedRequest, res: Response) { res.json({ success: true, data: await workflowService.decideRequest(req.user!, req.params.id!, false, req.body.reason) }); }
export async function submitDocuments(req: AuthedRequest, res: Response) { res.json({ success: true, data: await workflowService.submitDocuments(req.user!, req.params.id!, req.body) }); }
export async function accountantCheck(req: AuthedRequest, res: Response) { res.json({ success: true, data: await workflowService.accountantCheck(req.user!, req.params.id!, req.body.result, req.body.comment) }); }
export async function chairmanApprove(req: AuthedRequest, res: Response) { res.json({ success: true, data: await workflowService.chairmanDecision(req.user!, req.params.id!, true, req.body.comment) }); }
export async function chairmanReject(req: AuthedRequest, res: Response) { res.json({ success: true, data: await workflowService.chairmanDecision(req.user!, req.params.id!, false, req.body.reason) }); }
export async function disburse(req: AuthedRequest, res: Response) { res.status(201).json({ success: true, data: await workflowService.disburse(req.user!, req.params.id!, req.body) }); }
export async function exportDisbursement(req: AuthedRequest, res: Response) {
  const report = await workflowService.exportDisbursementReport(req.user!, req.params.id!);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${report.filename}"`);
  res.send(report.buffer);
}
