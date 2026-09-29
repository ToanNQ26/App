export const ROLES = ['REQUESTER', 'DEPARTMENT_HEAD', 'DIRECTOR', 'CHAIRMAN', 'ACCOUNTANT', 'ADMIN'] as const;
export type Role = typeof ROLES[number];
