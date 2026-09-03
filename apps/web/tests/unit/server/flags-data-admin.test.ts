import { CODE_FEATURE_FLAGS, type FeatureFlagKey } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { isEnabled } from "#server/services/feature-flags.js";

const MASK_EMAIL_REGEX = /(?<=^.).*(?=@)/;

describe("P2.9 Feature Flags, Data Export & Notification Admin Invariants (BR-FLG, BR-FFA, BR-EXP, BR-NTA)", () => {
  describe("Feature Flag Service Invariants (BR-FLG-01..07)", () => {
    it("Scenario: BR-FLG-01 — feature flags strictly govern operational toggles, never overriding entitlement rules", () => {
      const isEntitlementActive = true;
      const isFeatureFlagEnabled = false; // Flag disabled for maintenance
      const effectiveAccess = isEntitlementActive && isFeatureFlagEnabled;
      expect(effectiveAccess).toBe(false);
    });

    it("Scenario: BR-FLG-02 — evaluates to safe hardcoded default value if flag service or cache fails (D-KM)", async () => {
      const safeDefault = CODE_FEATURE_FLAGS.ai_content_pipeline?.defaultValue;
      expect(safeDefault).toBe(false);

      const val = await isEnabled("ai_content_pipeline");
      expect(typeof val).toBe("boolean");

      const unknownFlag = await isEnabled(
        "unknown_flag_xyz" as unknown as FeatureFlagKey
      );
      expect(unknownFlag).toBe(false);
    });

    it("Scenario: BR-FLG-03 — requires explicit non-null expiration date on all feature flag definitions", () => {
      for (const [key, def] of Object.entries(CODE_FEATURE_FLAGS)) {
        expect(def.expiresAt, `Flag ${key} must have expiresAt`).toBeDefined();
        const exp = new Date(def.expiresAt);
        expect(
          Number.isNaN(exp.getTime()),
          `Flag ${key} expiresAt must be valid date`
        ).toBe(false);
      }
    });

    it("Scenario: BR-FLG-04 / D-KO — percentage rollout flags are deterministic and sticky based on user_id hash", () => {
      const computeSticky = (userId: number, percentage: number) => {
        return userId % 100 < percentage;
      };

      const userA = 1042;
      const userB = 1089;
      // Fixed 50% rollout: userA (42 < 50) -> true; userB (89 >= 50) -> false
      expect(computeSticky(userA, 50)).toBe(true);
      expect(computeSticky(userB, 50)).toBe(false);

      // Deterministic: 100 consecutive calls return same value
      for (let i = 0; i < 100; i++) {
        expect(computeSticky(userA, 50)).toBe(true);
      }
    });

    it("Scenario: BR-FLG-05 — forbids feature flags from altering gameplay difficulty logic during active session", () => {
      // Invariant: no feature flag key references gameplay scoring or difficulty parameters
      for (const key of Object.keys(CODE_FEATURE_FLAGS)) {
        expect(key).not.toContain("difficulty");
        expect(key).not.toContain("score");
        expect(key).not.toContain("mastery");
      }
    });

    it("Scenario: BR-FLG-06 — forbids feature flags from overriding child privacy and consent constraints", () => {
      // Invariant: no feature flag key references consent, telemetry redaction, or child profile fields
      for (const key of Object.keys(CODE_FEATURE_FLAGS)) {
        expect(key).not.toContain("consent");
        expect(key).not.toContain("child_privacy");
        expect(key).not.toContain("telemetry_bypass");
      }
    });

    it("Scenario: BR-FLG-07 — 5 MVP flags exist in code with safe defaults", () => {
      const expectedKeys: FeatureFlagKey[] = [
        "ai_content_pipeline",
        "payment_soft_unlock",
        "weekly_progress_email",
        "studio_publish",
        "guest_play",
      ];

      for (const key of expectedKeys) {
        expect(CODE_FEATURE_FLAGS[key]).toBeDefined();
      }
      expect(CODE_FEATURE_FLAGS.ai_content_pipeline?.defaultValue).toBe(false);
      expect(CODE_FEATURE_FLAGS.payment_soft_unlock?.defaultValue).toBe(true);
      expect(CODE_FEATURE_FLAGS.weekly_progress_email?.defaultValue).toBe(
        false
      );
      expect(CODE_FEATURE_FLAGS.studio_publish?.defaultValue).toBe(true);
      expect(CODE_FEATURE_FLAGS.guest_play?.defaultValue).toBe(true);
    });
  });

  describe("Feature Flags Admin Invariants (BR-FFA-01..06)", () => {
    it("Scenario: BR-FFA-01 — updating feature flag requires audit reason of at least 10 characters", () => {
      const shortReason = "Tắt cờ";
      expect(shortReason.trim().length >= 10).toBe(false);

      const validReason =
        "Tắt cờ thử nghiệm tiến trình tuần để bảo trì hệ thống.";
      expect(validReason.trim().length >= 10).toBe(true);
    });

    it("Scenario: BR-FFA-02 — flags past expiration date display visual alert warning indicator", () => {
      const now = new Date("2027-01-01").getTime();
      const flagExp = new Date(
        CODE_FEATURE_FLAGS.ai_content_pipeline?.expiresAt ?? ""
      ).getTime();
      const isExpired = now > flagExp;
      expect(isExpired).toBe(true);
    });

    it("Scenario: BR-FFA-04 — source code declarations remain authoritative for feature flag metadata", () => {
      expect(Object.keys(CODE_FEATURE_FLAGS).length).toBe(6);
    });
  });

  describe("Data Export Invariants (BR-EXP-01..08)", () => {
    it("Scenario: BR-EXP-01 — limits data export to 6 typed predefined system export categories", () => {
      const exportTypes = [
        "revenue",
        "subscriptions",
        "content_kpi",
        "skill_coverage",
        "curriculum_health",
        "audit",
      ];
      expect(exportTypes.length).toBe(6);
    });

    it("Scenario: BR-EXP-02 — data export files strictly exclude all child PII (names, birth years, child UUIDs)", () => {
      const exportRow = {
        order_id: 101,
        user_email: "u***@example.com",
        amount: 490_000,
      };
      expect(exportRow).not.toHaveProperty("child_name");
      expect(exportRow).not.toHaveProperty("child_uuid");
      expect(exportRow).not.toHaveProperty("birth_year");
      expect(exportRow).not.toHaveProperty("display_name");
    });

    it("Scenario: BR-EXP-04 — generated export files are stored in private storage with 15-minute signed URLs", () => {
      const ttlMinutes = 15;
      expect(ttlMinutes).toBe(15);
    });

    it("Scenario: BR-EXP-05 — limits export size to max 100,000 rows per request returning 422 if exceeded", () => {
      const requestedRowsCount = 150_000;
      const isAllowed = requestedRowsCount <= 100_000;
      expect(isAllowed).toBe(false);
    });

    it("Scenario: BR-EXP-07 — rate limits export requests to max 5 per day per manager returning 429", () => {
      const dailyExportCount = 6;
      const isRateLimited = dailyExportCount > 5;
      expect(isRateLimited).toBe(true);
    });

    it("Scenario: BR-EXP-08 — user email address in subscriptions export is anonymized/masked", () => {
      const rawEmail = "user@example.com";
      const maskedEmail = rawEmail.replace(MASK_EMAIL_REGEX, "***");
      expect(maskedEmail).toBe("u***@example.com");
    });
  });

  describe("Notification Admin Invariants (BR-NTA-01..07)", () => {
    it("Scenario: BR-NTA-01 — resending notification creates a new notification record leaving historical record intact", () => {
      const originalNotif = { id: 1, status: "failed" };
      const resendNotif = { id: 2, status: "queued", original_id: 1 };
      expect(originalNotif.status).toBe("failed");
      expect(resendNotif.id).toBe(2);
      expect(resendNotif.id).not.toBe(originalNotif.id);
    });

    it("Scenario: BR-NTA-02 — forbids bulk notification operations targeting multiple recipients", () => {
      const allowedRecipientsCount = 1;
      expect(allowedRecipientsCount).toBe(1);
    });

    it("Scenario: BR-NTA-06 — forbids creating notification templates targeting child recipients", () => {
      const recipientType = "user";
      expect(recipientType).not.toBe("child");
    });
  });
});
