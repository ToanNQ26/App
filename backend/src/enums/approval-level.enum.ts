export const APPROVAL_LEVELS = [
  "AUTO",
  "DEPARTMENT_HEAD",
  "DIRECTOR",
  "CHAIRMAN",
] as const;
export type ApprovalLevel = (typeof APPROVAL_LEVELS)[number];
