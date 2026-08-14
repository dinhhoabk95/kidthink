import { ORDER_PENDING_TTL_HOURS, SOFT_UNLOCK_DAYS } from "@kidthink/config";

export type PaymentOrderStatus =
  | "draft"
  | "pending"
  | "pending_proof"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export const PAYMENT_ORDER_TERMINAL_STATES: readonly PaymentOrderStatus[] = [
  "approved",
  "rejected",
  "cancelled",
  "expired",
] as const;

export const PAYMENT_ORDER_TRANSITIONS: Record<
  PaymentOrderStatus,
  readonly PaymentOrderStatus[]
> = {
  draft: ["pending", "cancelled"],
  pending: ["pending_proof", "submitted", "cancelled", "expired"],
  pending_proof: ["submitted", "cancelled", "expired"],
  submitted: ["under_review", "approved", "rejected"],
  under_review: ["approved", "rejected"],
  approved: [],
  rejected: [],
  cancelled: [],
  expired: [],
};

export class PaymentOrderTransitionError extends Error {
  readonly from: PaymentOrderStatus;
  readonly to: PaymentOrderStatus;

  constructor(from: PaymentOrderStatus, to: PaymentOrderStatus) {
    super(
      `INVALID_STATUS_TRANSITION: Cannot transition payment order from "${from}" to "${to}".`
    );
    this.name = "PaymentOrderTransitionError";
    this.from = from;
    this.to = to;
  }
}

export function canTransitionPaymentOrderStatus(
  from: PaymentOrderStatus,
  to: PaymentOrderStatus
): boolean {
  const allowed = PAYMENT_ORDER_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function assertPaymentOrderTransition(
  from: PaymentOrderStatus,
  to: PaymentOrderStatus
): void {
  if (!canTransitionPaymentOrderStatus(from, to)) {
    throw new PaymentOrderTransitionError(from, to);
  }
}

export function isTerminalPaymentOrderStatus(
  status: PaymentOrderStatus
): boolean {
  return (PAYMENT_ORDER_TERMINAL_STATES as readonly string[]).includes(status);
}

/**
 * Format transfer note from order UUID (compact, uppercase, strictly formatted)
 * e.g., "TM12AB34CD"
 */
export function formatTransferNote(orderUuid: string): string {
  const clean = orderUuid
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();
  return `TM${clean}`;
}

export function computeSoftUnlockExpiresAt(fromDate = new Date()): Date {
  const expires = new Date(fromDate);
  expires.setDate(expires.getDate() + SOFT_UNLOCK_DAYS);
  return expires;
}

export function computeOrderPendingExpiresAt(fromDate = new Date()): Date {
  const expires = new Date(fromDate);
  expires.setHours(expires.getHours() + ORDER_PENDING_TTL_HOURS);
  return expires;
}
