import { describe, expect, it } from "vitest";
import {
  AutomatedPaymentWebhookPayloadSchema,
  canCancelRecurringSubscription,
  DUNNING_GRACE_PERIOD_DAYS,
  DUNNING_MAX_ATTEMPTS,
  isOfflinePackLeaseValid,
  isWebhookWithinReplayWindow,
  NOTICE_BEFORE_RECURRING_BILLING_DAYS,
  OFFLINE_PACK_MAX_LEASE_DAYS,
  OfflineCurriculumPackManifestSchema,
  PAYMENT_REPLAY_WINDOW_SECONDS,
  PaymentRefundRequestSchema,
  RecurringConsentSnapshotSchema,
  validateRefundAmount,
} from "../src/index.js";

describe("P5.0 Web Scale Contracts", () => {
  describe("BR-APM: Automated Payment & Webhook Verification", () => {
    it("validates legitimate payment webhook payload successfully", () => {
      const validPayload = {
        provider: "payos",
        provider_event_id: "evt_live_123456",
        order_uuid: "123e4567-e89b-12d3-a456-426614174000",
        amount_vnd: 599_000,
        status: "success",
        timestamp_seconds: 1_776_300_000,
        merchant_id: "merchant_vn_01",
      };
      const parsed = AutomatedPaymentWebhookPayloadSchema.parse(validPayload);
      expect(parsed.provider).toBe("payos");
      expect(parsed.amount_vnd).toBe(599_000);
    });

    it("rejects unsupported provider or invalid order UUID", () => {
      const invalidPayload = {
        provider: "stripe_unsupported",
        provider_event_id: "evt_123",
        order_uuid: "not-a-uuid",
        amount_vnd: -100,
        status: "success",
        timestamp_seconds: 1_776_300_000,
        merchant_id: "merchant_01",
      };
      const result =
        AutomatedPaymentWebhookPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("enforces replay window ≤ 300 seconds", () => {
      const nowSeconds = 1_776_300_500;
      expect(isWebhookWithinReplayWindow(nowSeconds - 120, nowSeconds)).toBe(
        true
      );
      expect(isWebhookWithinReplayWindow(nowSeconds - 300, nowSeconds)).toBe(
        true
      );
      expect(isWebhookWithinReplayWindow(nowSeconds - 301, nowSeconds)).toBe(
        false
      );
      expect(isWebhookWithinReplayWindow(nowSeconds + 301, nowSeconds)).toBe(
        false
      );
      expect(PAYMENT_REPLAY_WINDOW_SECONDS).toBe(300);
    });
  });

  describe("BR-RBL: Recurring Billing & Dunning Contracts", () => {
    it("pins dunning and notice constants per business rules", () => {
      expect(DUNNING_MAX_ATTEMPTS).toBe(3);
      expect(DUNNING_GRACE_PERIOD_DAYS).toBe(7);
      expect(NOTICE_BEFORE_RECURRING_BILLING_DAYS).toBe(3);
    });

    it("validates recurring consent snapshot schema", () => {
      const snapshot = {
        user_id: 42,
        package_code: "PKG_PREMIUM_YEAR",
        billing_period: "annual",
        price_vnd: 990_000,
        terms_version: "v2.1",
        opted_in_at: "2026-08-16T08:00:00.000Z",
      };
      const parsed = RecurringConsentSnapshotSchema.parse(snapshot);
      expect(parsed.user_id).toBe(42);
      expect(parsed.billing_period).toBe("annual");
    });

    it("evaluates cancellation eligibility based on subscription status", () => {
      expect(canCancelRecurringSubscription("active")).toBe(true);
      expect(canCancelRecurringSubscription("past_due")).toBe(true);
      expect(canCancelRecurringSubscription("cancelled")).toBe(false);
      expect(canCancelRecurringSubscription("expired")).toBe(false);
    });
  });

  describe("BR-RFD: Payment Refund & Audit Invariants", () => {
    it("validates refund request requiring admin note ≥ 10 characters", () => {
      const validRefund = {
        order_uuid: "123e4567-e89b-12d3-a456-426614174000",
        amount_vnd: 200_000,
        reason: "user_request",
        admin_note: "Phụ huynh yêu cầu hoàn tiền do trẻ nhập học tiểu học.",
        idempotency_key: "rf_idem_123456",
      };
      const parsed = PaymentRefundRequestSchema.parse(validRefund);
      expect(parsed.amount_vnd).toBe(200_000);

      const invalidNote = {
        ...validRefund,
        admin_note: "Quá ngắn",
      };
      const result = PaymentRefundRequestSchema.safeParse(invalidNote);
      expect(result.success).toBe(false);
    });

    it("validates refund amount against remaining captured amount", () => {
      const totalCaptured = 500_000;
      const alreadyRefunded = 200_000;

      const validAttempt = validateRefundAmount(
        totalCaptured,
        alreadyRefunded,
        300_000
      );
      expect(validAttempt.valid).toBe(true);
      expect(validAttempt.remainingRefundableVnd).toBe(300_000);

      const excessiveAttempt = validateRefundAmount(
        totalCaptured,
        alreadyRefunded,
        300_001
      );
      expect(excessiveAttempt.valid).toBe(false);

      const zeroAttempt = validateRefundAmount(
        totalCaptured,
        alreadyRefunded,
        0
      );
      expect(zeroAttempt.valid).toBe(false);
    });
  });

  describe("BR-OCP: Offline Curriculum Pack & Lease Manifest", () => {
    it("pins offline pack lease limit to 7 days", () => {
      expect(OFFLINE_PACK_MAX_LEASE_DAYS).toBe(7);
    });

    it("validates offline pack manifest and sha256 checksums", () => {
      const dummyHash =
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
      const manifest = {
        pack_id: "PACK-W03",
        curriculum_code: "CUR-001",
        week_number: 3,
        content_version: 2,
        lease_token: "tok_offline_lease_abcdef123456",
        lease_expires_at: "2026-08-23T08:00:00.000Z",
        total_size_bytes: 26_214_400,
        assets: [
          {
            path: "/games/d1-01/assets/fruit.webp",
            size_bytes: 1_048_576,
            sha256: dummyHash,
          },
        ],
        manifest_checksum_sha256: dummyHash,
      };

      const parsed = OfflineCurriculumPackManifestSchema.parse(manifest);
      expect(parsed.pack_id).toBe("PACK-W03");
      expect(parsed.week_number).toBe(3);
      expect(parsed.assets).toHaveLength(1);
    });

    it("validates offline lease expiration correctly", () => {
      const future = "2026-08-23T08:00:00.000Z";
      const past = "2026-08-10T08:00:00.000Z";
      const now = new Date("2026-08-16T08:00:00.000Z");

      expect(isOfflinePackLeaseValid(future, now)).toBe(true);
      expect(isOfflinePackLeaseValid(past, now)).toBe(false);
    });
  });
});
