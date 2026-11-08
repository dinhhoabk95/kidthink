import { ORDER_PENDING_TTL_HOURS, SOFT_UNLOCK_DAYS } from "@mindkid/config";

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

/**
 * Nguồn của lần chuyển trạng thái. Mặc định (không truyền) là luật §7.1 cho
 * mọi nguồn. `verified_gateway_webhook` chỉ dành cho webhook cổng thanh toán
 * tự động đã xác minh chữ ký (BR-APM-01, BR-APM-08).
 */
export type PaymentOrderTransitionSource =
  | "manual"
  | "verified_gateway_webhook";

export interface PaymentOrderTransitionOptions {
  readonly source?: PaymentOrderTransitionSource;
}

/** Cạnh bổ sung chỉ nguồn webhook đã xác minh được đi (payment-flow §7.1). */
export const GATEWAY_WEBHOOK_EXTRA_TRANSITIONS: Partial<
  Record<PaymentOrderStatus, readonly PaymentOrderStatus[]>
> = {
  pending: ["approved", "under_review"],
  pending_proof: ["approved", "under_review"],
};

import { AppError } from "@mindkid/errors/base";

export class PaymentOrderTransitionError extends AppError<{
  readonly from: PaymentOrderStatus;
  readonly to: PaymentOrderStatus;
}> {
  readonly from: PaymentOrderStatus;
  readonly to: PaymentOrderStatus;

  constructor(from: PaymentOrderStatus, to: PaymentOrderStatus) {
    super({
      code: "INVALID_STATUS_TRANSITION",
      status: 409,
      message: `Chuyển trạng thái đơn hàng từ "${from}" sang "${to}" không hợp lệ.`,
      details: { from, to },
      name: "PaymentOrderTransitionError",
    });
    this.from = from;
    this.to = to;
  }
}

export function canTransitionPaymentOrderStatus(
  from: PaymentOrderStatus,
  to: PaymentOrderStatus,
  options: PaymentOrderTransitionOptions = {}
): boolean {
  if (PAYMENT_ORDER_TRANSITIONS[from].includes(to)) {
    return true;
  }
  if (options.source === "verified_gateway_webhook") {
    return GATEWAY_WEBHOOK_EXTRA_TRANSITIONS[from]?.includes(to) ?? false;
  }
  return false;
}

export function assertPaymentOrderTransition(
  from: PaymentOrderStatus,
  to: PaymentOrderStatus,
  options: PaymentOrderTransitionOptions = {}
): void {
  if (!canTransitionPaymentOrderStatus(from, to, options)) {
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
