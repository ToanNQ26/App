import type { Response } from 'express';
import type { AuthedRequest } from '../types/index.js';
import * as adminService from '../services/admin.service.js';

export async function listUsers(_req: AuthedRequest, res: Response) { res.json({ success: true, data: await adminService.listUsers() }); }
export async function createUser(req: AuthedRequest, res: Response) { res.status(201).json({ success: true, data: await adminService.createUser(req.body), message: 'Đã tạo tài khoản' }); }
export async function updateUser(req: AuthedRequest, res: Response) { res.json({ success: true, data: await adminService.updateUser(req.params.id!, req.body) }); }
export async function listDepartments(_req: AuthedRequest, res: Response) { res.json({ success: true, data: await adminService.listDepartments() }); }
export async function createDepartment(req: AuthedRequest, res: Response) { res.status(201).json({ success: true, data: await adminService.createDepartment(req.body) }); }
export async function updateDepartment(req: AuthedRequest, res: Response) { res.json({ success: true, data: await adminService.updateDepartment(req.params.id!, req.body) }); }
