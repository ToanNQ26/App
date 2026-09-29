export const REQUEST_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "WAITING_PAYMENT_DOCUMENTS",
  "REJECTED",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
