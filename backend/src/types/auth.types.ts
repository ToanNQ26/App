import type { Request } from 'express';
import type { Role } from '../enums/index.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string;
}

export interface AuthedRequest extends Request<Record<string, string>> {
  user?: AuthUser;
}
