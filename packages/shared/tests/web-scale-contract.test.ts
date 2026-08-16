import { describe, expect, it } from "vitest";
import {
  AdminSubscriptionCancelRequestSchema,
  AutomatedPaymentWebhookPayloadSchema,
  canCancelRecurringSubscription,
  computePaymentWebhookSignature,
  DUNNING_GRACE_PERIOD_DAYS,
  DUNNING_MAX_ATTEMPTS,
  isOfflinePackLeaseValid,
  isWebhookWithinReplayWindow,
  NOTICE_BEFORE_RECURRING_BILLING_DAYS,
  OFFLINE_PACK_MAX_LEASE_DAYS,
  OfflineCurriculumPackManifestSchema,
  PAYMENT_REPLAY_WINDOW_SECONDS,
  RecurringConsentSnapshotSchema,
  verifyPaymentWebhookSignature,
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

    it("verifies HMAC-SHA256 signature for raw webhook payloads", () => {
      const secret = "test_webhook_secret_key_12345";
      const rawBody = JSON.stringify({
        provider: "payos",
        provider_event_id: "evt_test_1",
        order_uuid: "123e4567-e89b-12d3-a456-426614174000",
        amount_vnd: 490_000,
        status: "success",
        timestamp_seconds: 1_776_300_000,
        merchant_id: "merchant_01",
      });

      const signature = computePaymentWebhookSignature(rawBody, secret);
      expect(signature).toBeDefined();
      expect(verifyPaymentWebhookSignature(rawBody, signature, secret)).toBe(
        true
      );
      expect(
        verifyPaymentWebhookSignature(rawBody, "invalid_sig_hex_1234", secret)
      ).toBe(false);
      expect(
        verifyPaymentWebhookSignature(rawBody, signature, "wrong_secret")
      ).toBe(false);
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

  describe("BR-ASC: Admin Subscription Cancellation & Audit Invariants", () => {
    it("validates admin subscription cancel request requiring note ≥ 20 characters", () => {
      const validCancel = {
        subscription_id: 101,
        reason: "user_request_zalo",
        admin_note:
          "Khách hàng liên hệ qua Zalo OA #ZL-8823 xin huỷ do chuyển trường.",
        revoke_immediate: false,
      };
      const parsed = AdminSubscriptionCancelRequestSchema.parse(validCancel);
      expect(parsed.subscription_id).toBe(101);
      expect(parsed.reason).toBe("user_request_zalo");
      expect(parsed.revoke_immediate).toBe(false);

      const invalidNote = {
        ...validCancel,
        admin_note: "Quá ngắn <20",
      };
      const result =
        AdminSubscriptionCancelRequestSchema.safeParse(invalidNote);
      expect(result.success).toBe(false);
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
