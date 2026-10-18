import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

// ============================================================================
// 1. Automated Payment & Gateway Webhook Contracts (BR-APM)
// ============================================================================

export const AUTOMATED_PAYMENT_PROVIDERS = ["payos", "vnpay", "momo"] as const;

export type AutomatedPaymentProvider =
  (typeof AUTOMATED_PAYMENT_PROVIDERS)[number];

export const PAYMENT_REPLAY_WINDOW_SECONDS = 300; // ≤ 5 minutes

/** Chế độ vận hành của cổng (UC-079 BR-001). Tín hiệu sandbox không duyệt đơn live. */
export const PAYMENT_OPERATING_MODES = ["sandbox", "live"] as const;

export type PaymentOperatingMode = (typeof PAYMENT_OPERATING_MODES)[number];

export const AutomatedPaymentWebhookPayloadSchema = z.object({
  provider: z.enum(AUTOMATED_PAYMENT_PROVIDERS),
  provider_event_id: z.string().min(1),
  order_uuid: z.string().uuid(),
  amount_vnd: z.number().int().positive(),
  status: z.enum(["success", "failed", "cancelled"]),
  timestamp_seconds: z.number().int().positive(),
  merchant_id: z.string().min(1),
  mode: z.enum(PAYMENT_OPERATING_MODES),
});

export type AutomatedPaymentWebhookPayload = z.infer<
  typeof AutomatedPaymentWebhookPayloadSchema
>;

export type PaymentWebhookParseResult =
  | { ok: true; payload: AutomatedPaymentWebhookPayload }
  | { ok: false };

/**
 * Parse thân thô của webhook. CHỈ gọi sau khi chữ ký đã xác minh trên đúng
 * chuỗi byte này (UC-079 BR-001: kiểm chữ ký trước khi đọc nội dung).
 */
export function parsePaymentWebhookBody(
  rawBody: string
): PaymentWebhookParseResult {
  try {
    const result = AutomatedPaymentWebhookPayloadSchema.safeParse(
      JSON.parse(rawBody)
    );
    return result.success ? { ok: true, payload: result.data } : { ok: false };
  } catch {
    return { ok: false };
  }
}

function constantTimeStringEqual(a: string, b: string): boolean {
  const aHash = createHmac("sha256", "payment-origin").update(a).digest();
  const bHash = createHmac("sha256", "payment-origin").update(b).digest();
  return timingSafeEqual(aHash, bHash);
}

/**
 * Đối chiếu mã đơn vị nhận tiền và chế độ vận hành của tín hiệu với cấu hình
 * (UC-079 BR-001 bước 5). So sánh hằng thời gian.
 */
export function isPaymentWebhookOriginTrusted(
  payload: Pick<AutomatedPaymentWebhookPayload, "merchant_id" | "mode">,
  expected: { merchantId: string; mode: PaymentOperatingMode }
): boolean {
  const merchantOk = constantTimeStringEqual(
    payload.merchant_id,
    expected.merchantId
  );
  const modeOk = payload.mode === expected.mode;
  return merchantOk && modeOk;
}

export function isWebhookWithinReplayWindow(
  webhookTimestampSeconds: number,
  currentTimestampSeconds: number
): boolean {
  const diff = Math.abs(currentTimestampSeconds - webhookTimestampSeconds);
  return diff <= PAYMENT_REPLAY_WINDOW_SECONDS;
}

export function computePaymentWebhookSignature(
  rawBody: string,
  secretKey: string
): string {
  return createHmac("sha256", secretKey).update(rawBody, "utf8").digest("hex");
}

export function verifyPaymentWebhookSignature(
  rawBody: string,
  signature: string,
  secretKey: string
): boolean {
  if (!(signature && secretKey && rawBody)) {
    return false;
  }
  try {
    const expected = computePaymentWebhookSignature(rawBody, secretKey);
    const expectedBuf = Buffer.from(expected, "hex");
    const givenBuf = Buffer.from(signature, "hex");
    if (expectedBuf.length !== givenBuf.length) {
      return false;
    }
    return timingSafeEqual(expectedBuf, givenBuf);
  } catch {
    return false;
  }
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
// 3. Admin Subscription Cancellation Contracts (BR-ASC)
// ============================================================================

export const ADMIN_SUBSCRIPTION_CANCEL_REASONS = [
  "user_request_zalo",
  "user_request_messenger",
  "user_request_email",
  "admin_override",
  "other",
] as const;

export type AdminSubscriptionCancelReason =
  (typeof ADMIN_SUBSCRIPTION_CANCEL_REASONS)[number];

export const AdminSubscriptionCancelRequestSchema = z.object({
  subscription_id: z.number().int().positive(),
  reason: z.enum(ADMIN_SUBSCRIPTION_CANCEL_REASONS),
  admin_note: z.string().min(20, "Ghi chú huỷ gói bắt buộc tối thiểu 20 ký tự"),
  revoke_immediate: z.boolean().default(false),
});

export type AdminSubscriptionCancelRequest = z.infer<
  typeof AdminSubscriptionCancelRequestSchema
>;

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
