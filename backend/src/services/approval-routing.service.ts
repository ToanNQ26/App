import type { ApprovalLevel, Role } from '../enums/index.js';

export const AUTO_AMOUNT_LIMIT = 1_000_000;
export const DIRECTOR_AMOUNT_LIMIT = 50_000_000;
export const MONTHLY_AUTO_LIMIT: Partial<Record<Role, number>> = { DEPARTMENT_HEAD: 10_000_000, DIRECTOR: 50_000_000 };

export function manualApprovalLevel(amount: number): ApprovalLevel {
  if (amount <= AUTO_AMOUNT_LIMIT) return 'DEPARTMENT_HEAD';
  if (amount <= DIRECTOR_AMOUNT_LIMIT) return 'DIRECTOR';
  return 'CHAIRMAN';
}

export function roleCanApprove(role: Role, level: ApprovalLevel): boolean {
  const rank: Partial<Record<Role,number>> = { DEPARTMENT_HEAD:1, DIRECTOR:2, CHAIRMAN:3 };
  const required = { AUTO:99, DEPARTMENT_HEAD:1, DIRECTOR:2, CHAIRMAN:3 }[level];
  return (rank[role] ?? 0) >= required;
}

export function autoApprovalEligible(role: Role, amount: number, monthlyAutoTotal: number): boolean {
  const monthlyLimit = MONTHLY_AUTO_LIMIT[role];
  return amount <= AUTO_AMOUNT_LIMIT && monthlyLimit !== undefined && monthlyAutoTotal + amount <= monthlyLimit;
}
