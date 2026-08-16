import { z } from "zod";

// ============================================================================
// 1. Automated Payment & Gateway Webhook Contracts (BR-APM)
// ============================================================================

export const AUTOMATED_PAYMENT_PROVIDERS = ["payos", "vnpay", "momo"] as const;

export type AutomatedPaymentProvider =
  (typeof AUTOMATED_PAYMENT_PROVIDERS)[number];

export const PAYMENT_REPLAY_WINDOW_SECONDS = 300; // ≤ 5 minutes

export const AutomatedPaymentWebhookPayloadSchema = z.object({
  provider: z.enum(AUTOMATED_PAYMENT_PROVIDERS),
  provider_event_id: z.string().min(1),
  order_uuid: z.string().uuid(),
  amount_vnd: z.number().int().positive(),
  status: z.enum(["success", "failed", "cancelled"]),
  timestamp_seconds: z.number().int().positive(),
  merchant_id: z.string().min(1),
});

export type AutomatedPaymentWebhookPayload = z.infer<
  typeof AutomatedPaymentWebhookPayloadSchema
>;

export function isWebhookWithinReplayWindow(
  webhookTimestampSeconds: number,
  currentTimestampSeconds: number
): boolean {
  const diff = Math.abs(currentTimestampSeconds - webhookTimestampSeconds);
  return diff <= PAYMENT_REPLAY_WINDOW_SECONDS;
}

// ============================================================================
// 2. Recurring Billing & Dunning Lifecycle Contracts (BR-RBL)
// ============================================================================

export const RECURRING_SUBSCRIPTION_STATUSES = [
  "active",
  "past_due",
  "cancelled",
  "expired",
] as const;

export type RecurringSubscriptionStatus =
  (typeof RECURRING_SUBSCRIPTION_STATUSES)[number];

export const DUNNING_MAX_ATTEMPTS = 3;
export const DUNNING_GRACE_PERIOD_DAYS = 7;
export const NOTICE_BEFORE_RECURRING_BILLING_DAYS = 3;

export const RecurringConsentSnapshotSchema = z.object({
  user_id: z.number().int().positive(),
  package_code: z.string().min(1),
  billing_period: z.enum(["monthly", "annual"]),
  price_vnd: z.number().int().positive(),
  terms_version: z.string().min(1),
  opted_in_at: z.string().datetime(),
});

export type RecurringConsentSnapshot = z.infer<
  typeof RecurringConsentSnapshotSchema
>;

export function canCancelRecurringSubscription(
  currentStatus: RecurringSubscriptionStatus
): boolean {
  return currentStatus === "active" || currentStatus === "past_due";
}

// ============================================================================
// 3. Payment Refund & Control Contracts (BR-RFD)
// ============================================================================

export const PAYMENT_REFUND_REASONS = [
  "user_request",
  "duplicate_payment",
  "fraud",
  "other",
] as const;

export type PaymentRefundReason = (typeof PAYMENT_REFUND_REASONS)[number];

export const PaymentRefundRequestSchema = z.object({
  order_uuid: z.string().uuid(),
  amount_vnd: z.number().int().positive(),
  reason: z.enum(PAYMENT_REFUND_REASONS),
  admin_note: z
    .string()
    .min(10, "Ghi chú hoàn tiền bắt buộc tối thiểu 10 ký tự"),
  idempotency_key: z.string().min(8),
});

export type PaymentRefundRequest = z.infer<typeof PaymentRefundRequestSchema>;

export function validateRefundAmount(
  totalCapturedVnd: number,
  totalAlreadyRefundedVnd: number,
  requestedRefundVnd: number
): { valid: boolean; remainingRefundableVnd: number } {
  const remaining = totalCapturedVnd - totalAlreadyRefundedVnd;
  const valid = requestedRefundVnd > 0 && requestedRefundVnd <= remaining;
  return { valid, remainingRefundableVnd: remaining };
}

// ============================================================================
// 4. Offline Curriculum Pack & Lease Contracts (BR-OCP)
// ============================================================================

export const OFFLINE_PACK_MAX_LEASE_DAYS = 7;
export const OFFLINE_PACK_STORAGE_WARNING_BUFFER_MB = 50;

export const OfflineAssetItemSchema = z.object({
  path: z.string().min(1),
  size_bytes: z.number().int().positive(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i),
});

export type OfflineAssetItem = z.infer<typeof OfflineAssetItemSchema>;

export const OfflineCurriculumPackManifestSchema = z.object({
  pack_id: z.string().min(1),
  curriculum_code: z.string().regex(/^CUR-\d{3}$/),
  week_number: z.number().int().min(1).max(42),
  content_version: z.number().int().positive(),
  lease_token: z.string().min(16),
  lease_expires_at: z.string().datetime(),
  total_size_bytes: z.number().int().positive(),
  assets: z.array(OfflineAssetItemSchema).min(1),
  manifest_checksum_sha256: z.string().regex(/^[a-f0-9]{64}$/i),
});

export type OfflineCurriculumPackManifest = z.infer<
  typeof OfflineCurriculumPackManifestSchema
>;

export function isOfflinePackLeaseValid(
  leaseExpiresAtIso: string,
  now = new Date()
): boolean {
  const expiresAt = new Date(leaseExpiresAtIso);
  return expiresAt.getTime() > now.getTime();
}
