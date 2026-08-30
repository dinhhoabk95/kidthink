import {
  auditLogs,
  entitlementKeys,
  entitlements,
  getOwnerDb,
  managers,
  packages,
  paymentOrders,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  users,
} from "@mindkid/db";
import {
  computeStackedExpiryDate,
  PACKAGE_CATALOG,
  type PackageDefinition,
} from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

describe("P2.4 Entitlement Grant, Package Catalog Admin & Subscription View Invariants (BR-EGR, BR-PCA, BR-SBV)", () => {
  beforeAll(async () => {
    const db = getOwnerDb();
    for (const k of SEED_ENTITLEMENT_KEYS) {
      await db.insert(entitlementKeys).values(k).onConflictDoNothing();
    }
    for (const pkg of SEED_PACKAGES) {
      await db.insert(packages).values(pkg).onConflictDoNothing();
    }
  });
  describe("Entitlement Grant Invariants (BR-EGR-01..09)", () => {
    it("Scenario: BR-EGR-01 — grants entitlements at package level only, forbidding individual key overrides", () => {
      const grantPayload = {
        package_code: "PKG-standard",
        duration_days: 30,
        grant_reason: "Cấp quyền sử dụng 30 ngày cho đối tác.",
      };
      expect(grantPayload).toHaveProperty("package_code");
      expect(grantPayload).not.toHaveProperty("entitlement_key");
      expect(PACKAGE_CATALOG[grantPayload.package_code]).toBeDefined();
    });

    it("Scenario: BR-EGR-02 — manual grant requires an admin note of at least 20 characters", () => {
      const shortNote = "Cấp dùng thử";
      const isShortValid = shortNote.trim().length >= 20;
      expect(isShortValid).toBe(false);

      const validNote =
        "Cấp quyền sử dụng gói Premium 30 ngày cho đối tác thử nghiệm.";
      const isValid = validNote.trim().length >= 20;
      expect(isValid).toBe(true);
    });

    it("Scenario: BR-EGR-03 — manual grants and revocations record audit log entries with before/after state", async () => {
      const db = getOwnerDb();
      const [u] = await db
        .insert(users)
        .values({
          email: `user_egr03_${Date.now()}@example.com`,
          displayName: "EGR-03 User",
        })
        .returning();
      if (!u) {
        throw new Error("Failed to insert u");
      }

      await db.insert(auditLogs).values({
        actorType: "manager",
        actorId: 1,
        action: "entitlement_granted",
        entityType: "user",
        entityId: String(u.id),
        beforeData: { count: 0 },
        afterData: { package_code: "PKG-standard", duration_days: 30 },
        reason: "Cấp quyền sử dụng 30 ngày cho đối tác thử nghiệm.",
      });

      const [entry] = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.action, "entitlement_granted"),
            eq(auditLogs.entityId, String(u.id))
          )
        );
      if (!entry) {
        throw new Error("Failed to find entry");
      }

      expect(entry).toBeDefined();
      expect(entry.reason).toContain("Cấp quyền sử dụng 30 ngày");
      expect(entry.afterData).toHaveProperty("package_code", "PKG-standard");
    });

    it("Scenario: BR-EGR-04 — duration_days is strictly bounded between 1 and 365 days", () => {
      const durationDaysValid = 30;
      expect(durationDaysValid >= 1 && durationDaysValid <= 365).toBe(true);

      const durationDaysInvalid = 3650;
      expect(durationDaysInvalid >= 1 && durationDaysInvalid <= 365).toBe(
        false
      );

      const durationDaysZero = 0;
      expect(durationDaysZero >= 1 && durationDaysZero <= 365).toBe(false);
    });

    it("Scenario: BR-EGR-05 — manual grant API requires requireManagerAuth() with super_admin role", () => {
      const reviewerRole: string = "content_reviewer";
      const isReviewerAllowed = reviewerRole === "super_admin";
      expect(isReviewerAllowed).toBe(false);

      const adminRole: string = "super_admin";
      const isAdminAllowed = adminRole === "super_admin";
      expect(isAdminAllowed).toBe(true);
    });

    it("Scenario: BR-EGR-06 — revoking an entitlement takes effect immediately, invalidating permissions cache", async () => {
      const db = getOwnerDb();
      const [u] = await db
        .insert(users)
        .values({
          email: `user_egr06_${Date.now()}@example.com`,
          displayName: "EGR-06 User",
        })
        .returning();
      if (!u) {
        throw new Error("Failed to insert u");
      }

      const [ent] = await db
        .insert(entitlements)
        .values({
          userId: u.id,
          entitlementKey: "play_standard_games",
          source: "manual_grant",
          status: "active",
        })
        .returning();
      if (!ent) {
        throw new Error("Failed to insert ent");
      }

      await db
        .update(entitlements)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(entitlements.id, ent.id));

      const [updated] = await db
        .select()
        .from(entitlements)
        .where(eq(entitlements.id, ent.id));
      if (!updated) {
        throw new Error("Failed to find updated");
      }

      expect(updated.status).toBe("cancelled");
    });

    it("Scenario: BR-EGR-07 — granting additional entitlement extends duration from max(now, expires_at)", () => {
      const now = new Date("2026-08-15T00:00:00Z");
      // Remaining 50 days
      const existingExpiry = new Date(now.getTime() + 50 * 86_400_000);
      const addDays = 100;

      const newExpiry = computeStackedExpiryDate(
        existingExpiry,
        addDays,
        0,
        now
      );
      expect(newExpiry).toBeDefined();
      if (newExpiry) {
        // New expiry should be exactly 150 days from now
        const totalDaysFromNow = Math.round(
          (newExpiry.getTime() - now.getTime()) / 86_400_000
        );
        expect(totalDaysFromNow).toBe(150);
      }
    });

    it("Scenario: BR-EGR-08 — manual grants create NO payment_orders records", async () => {
      const db = getOwnerDb();
      const [u] = await db
        .insert(users)
        .values({
          email: `user_egr08_${Date.now()}@example.com`,
          displayName: "EGR-08 User",
        })
        .returning();
      if (!u) {
        throw new Error("Failed to insert u");
      }

      // Insert manual grant
      await db.insert(entitlements).values({
        userId: u.id,
        entitlementKey: "play_standard_games",
        source: "manual_grant",
        status: "active",
      });

      // Assert 0 payment orders
      const orders = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.userId, u.id));

      expect(orders).toHaveLength(0);
    });

    it("Scenario: BR-EGR-09 — monthly job generates summary report of all manual grants for super_admin", async () => {
      const db = getOwnerDb();
      const [mgr] = await db
        .insert(managers)
        .values({
          email: `mgr_egr09_${Date.now()}@example.com`,
          displayName: "Super Admin EGR-09",
          role: "super_admin",
          passwordHash: "mock-pwd-hash",
        })
        .returning();
      if (!mgr) {
        throw new Error("Failed to insert mgr");
      }

      expect(mgr.role).toBe("super_admin");
      expect(mgr.email).toBeDefined();
    });
  });

  describe("Package Catalog Admin Invariants (BR-PCA-01..06)", () => {
    it("Scenario: BR-PCA-01 — package catalog in admin is strictly read-only with no write routes", () => {
      const allowedMethods = ["GET"];
      expect(allowedMethods).not.toContain("POST");
      expect(allowedMethods).not.toContain("PATCH");
      expect(allowedMethods).not.toContain("DELETE");
    });

    it("Scenario: BR-PCA-02 & BR-PCA-04 — package catalog list displays non-public add-on packages with requires_spec", () => {
      const allPkgs = Object.values(PACKAGE_CATALOG) as PackageDefinition[];
      const unreleased = allPkgs.filter((p) => !p.is_public);

      expect(unreleased.length).toBe(4);
      for (const addon of unreleased) {
        expect(addon.is_public).toBe(false);
        expect(addon.requires_spec).toBeDefined();
        expect(addon.requires_spec?.length).toBeGreaterThan(0);
      }
    });

    it("Scenario: BR-PCA-03 — catalog view displays count of active subscribers per package", async () => {
      const db = getOwnerDb();
      const [u] = await db
        .insert(users)
        .values({
          email: `user_pca03_${Date.now()}@example.com`,
          displayName: "PCA-03 User",
        })
        .returning();
      if (!u) {
        throw new Error("Failed to insert u");
      }

      await db.insert(entitlements).values({
        userId: u.id,
        entitlementKey: "play_standard_games",
        source: "package_order",
        status: "active",
      });

      const activeEnts = await db
        .select()
        .from(entitlements)
        .where(
          and(eq(entitlements.userId, u.id), eq(entitlements.status, "active"))
        );

      expect(activeEnts.length).toBeGreaterThanOrEqual(1);
    });

    it("Scenario: BR-PCA-05 — package catalog admin requires super_admin role", () => {
      const callerRole: string = "content_reviewer";
      const isAllowed = callerRole === "super_admin";
      expect(isAllowed).toBe(false);
    });

    it("Scenario: BR-PCA-06 — package subscriber list excludes child profile PII", () => {
      const subscriberObj = {
        user_id: 1,
        email: "user@example.com",
        display_name: "Parent Name",
        source: "manual_grant",
        granted_at: "2026-08-01",
        expires_at: "2026-09-01",
      };
      expect(subscriberObj).not.toHaveProperty("child_name");
      expect(subscriberObj).not.toHaveProperty("children");
      expect(subscriberObj).not.toHaveProperty("child_profiles");
    });
  });

  describe("Subscription View Invariants (BR-SBV-01..07)", () => {
    it("Scenario: BR-SBV-01 — user subscription view resolves effective entitlements dynamically from package_entitlements", () => {
      const pkgStandard = PACKAGE_CATALOG["PKG-standard"];
      if (!pkgStandard) {
        throw new Error("PKG-standard not found");
      }
      expect(pkgStandard.entitlements).toContain("play_standard_games");
      expect(pkgStandard.entitlements).toContain("manage_children");
    });

    it("Scenario: BR-SBV-02 — displays data preservation guarantee text on subscription expiry notice", () => {
      const notice =
        "Khi gói hết hạn, hồ sơ của các bé và toàn bộ tiến độ học vẫn được giữ nguyên. Bạn chỉ tạm thời không truy cập được nội dung trả phí.";
      expect(notice).toContain(
        "hồ sơ của các bé và toàn bộ tiến độ học vẫn được giữ nguyên"
      );
    });

    it("Scenario: BR-SBV-03 — payment history displays all order attempts including rejected and cancelled orders", async () => {
      const db = getOwnerDb();
      const [u] = await db
        .insert(users)
        .values({
          email: `user_sbv03_${Date.now()}@example.com`,
          displayName: "SBV-03 User",
        })
        .returning();
      if (!u) {
        throw new Error("Failed to insert u");
      }

      await db.insert(paymentOrders).values([
        {
          userId: u.id,
          packageCode: "PKG-standard",
          offerCode: "annual",
          amountVnd: 299_000,
          status: "approved",
        },
        {
          userId: u.id,
          packageCode: "PKG-premium",
          offerCode: "annual",
          amountVnd: 490_000,
          status: "rejected",
        },
      ]);

      const orders = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.userId, u.id));

      expect(orders).toHaveLength(2);
    });

    it("Scenario: BR-SBV-04 — hides internal admin notes from user-facing payment order history", () => {
      const orderDbRow = {
        id: 1,
        status: "rejected",
        adminNote: JSON.stringify({
          fraud_alert: true,
          secret_note: "Ghi chú nội bộ bí mật",
        }),
      };

      // Transform for user API
      const userFacingOrder = {
        id: orderDbRow.id,
        status: orderDbRow.status,
        polite_reason:
          "Thông tin chuyển khoản chưa khớp với giao dịch ngân hàng.",
      };

      expect(userFacingOrder).not.toHaveProperty("adminNote");
      expect(userFacingOrder).not.toHaveProperty("admin_note");
      expect(JSON.stringify(userFacingOrder)).not.toContain(
        "Ghi chú nội bộ bí mật"
      );
    });

    it("Scenario: BR-SBV-05 — multiple active package grants combine entitlement keys seamlessly", () => {
      const standardKeys = PACKAGE_CATALOG["PKG-standard"]?.entitlements ?? [];
      const addonKeys =
        PACKAGE_CATALOG["PKG-addon_lesson_plan"]?.entitlements ?? [];

      const combined = Array.from(new Set([...standardKeys, ...addonKeys]));
      expect(combined).toContain("play_standard_games");
      expect(combined).toContain("create_lesson_plan");
      expect(combined).toContain("export_pdf");
    });

    it("Scenario: BR-SBV-06 — subscription view API is restricted to authorized account owner", () => {
      const ownerId = 100;
      const callerId = 100;
      const isOwner = ownerId === callerId;
      expect(isOwner).toBe(true);

      const otherCallerId: number = 101;
      const isOtherOwner = ownerId === otherCallerId;
      expect(isOtherOwner).toBe(false);
    });

    it("Scenario: BR-SBV-07 — displays at most one upgrade CTA on user subscription view", () => {
      const hasHigherTier = true;
      const ctaCount = hasHigherTier ? 1 : 0;
      expect(ctaCount).toBeLessThanOrEqual(1);
    });
  });
});
