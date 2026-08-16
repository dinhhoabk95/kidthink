import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  adminCancelSubscription,
  auditLogs,
  createRecurringSubscription,
  entitlementKeys,
  entitlements,
  getOwnerDb,
  packages,
  recurringSubscriptions,
  runDunningSweep,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  userCancelRecurringSubscription,
  users,
} from "../../src/index.js";

const RE_INVALID_CANCEL_REASON = /Ghi chú|VALIDATION_FAILED/;

describe("Admin & User Subscription Cancellation Integration Tests (P5.1 / Task #71)", () => {
  beforeEach(async () => {
    const db = getOwnerDb();

    await db
      .insert(packages)
      .values(SEED_PACKAGES as unknown as (typeof packages.$inferInsert)[])
      .onConflictDoNothing();

    await db
      .insert(entitlementKeys)
      .values(
        SEED_ENTITLEMENT_KEYS as unknown as (typeof entitlementKeys.$inferInsert)[]
      )
      .onConflictDoNothing();
  });

  it("Scenario: BR-RBL-03 — user self-cancel sets auto_renew=false, status=cancelled, and preserves entitlements until period end", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `user_self_cancel_${Date.now()}@example.com`,
        displayName: "Self Cancel User",
      })
      .returning();

    const now = new Date();
    const sub = await createRecurringSubscription(
      {
        userId: user.id,
        packageCode: "PKG-standard",
        offerCode: "monthly",
        billingPeriod: "monthly",
        priceVnd: 49_000,
        termsVersion: "v1.0",
      },
      now
    );

    // Grant active entitlement
    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "play_standard_games",
      source: "package_order",
      status: "active",
      expiresAt: sub.currentPeriodEnd,
    });

    const result = await userCancelRecurringSubscription(user.id, sub.id, now);

    expect(result.status).toBe("cancelled");
    expect(result.auto_renew).toBe(false);

    // Verify sub in DB
    const [dbSub] = await db
      .select()
      .from(recurringSubscriptions)
      .where(eq(recurringSubscriptions.id, sub.id));
    expect(dbSub.status).toBe("cancelled");
    expect(dbSub.autoRenew).toBe(false);
    expect(dbSub.cancelledBy).toBe("user");

    // Verify entitlement is STILL active until current_period_end
    const [dbEntitlement] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, user.id));
    expect(dbEntitlement.status).toBe("active");
    expect(dbEntitlement.expiresAt).toBeDefined();
    expect(new Date(dbEntitlement.expiresAt ?? "").getTime()).toBe(
      sub.currentPeriodEnd.getTime()
    );
  });

  it("Scenario: BR-ASC-01..06 — admin subscription cancel with revoke_immediate=false keeps entitlement active", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `admin_cancel_retain_${Date.now()}@example.com`,
        displayName: "Admin Cancel User",
      })
      .returning();

    const now = new Date();
    const sub = await createRecurringSubscription(
      {
        userId: user.id,
        packageCode: "PKG-standard",
        offerCode: "annual",
        billingPeriod: "annual",
        priceVnd: 299_000,
        termsVersion: "v1.0",
      },
      now
    );

    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "play_standard_games",
      source: "package_order",
      status: "active",
      expiresAt: sub.currentPeriodEnd,
    });

    const result = await adminCancelSubscription(
      {
        managerId: 1,
        subscriptionId: sub.id,
        reason: "user_request_zalo",
        adminNote: "Khách hàng yêu cầu hỗ trợ huỷ qua kênh Zalo OA chính thức.",
        revokeImmediate: false,
      },
      now
    );

    expect(result.status).toBe("cancelled");
    expect(result.revoke_immediate).toBe(false);

    // Entitlement remains active
    const [dbEntitlement] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, user.id));
    expect(dbEntitlement.status).toBe("active");

    // Audit log written
    const [audit] = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, "recurring_subscription"),
          eq(auditLogs.entityId, String(sub.id))
        )
      );
    expect(audit).toBeDefined();
    expect(audit.action).toBe("subscription.cancelled_by_admin");
  });

  it("Scenario: BR-ASC-04 — admin subscription cancel with revoke_immediate=true immediately cancels entitlements", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `admin_cancel_revoke_${Date.now()}@example.com`,
        displayName: "Admin Revoke User",
      })
      .returning();

    const now = new Date();
    const sub = await createRecurringSubscription(
      {
        userId: user.id,
        packageCode: "PKG-standard",
        offerCode: "annual",
        billingPeriod: "annual",
        priceVnd: 299_000,
        termsVersion: "v1.0",
      },
      now
    );

    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "play_standard_games",
      source: "package_order",
      status: "active",
      expiresAt: sub.currentPeriodEnd,
    });

    const result = await adminCancelSubscription(
      {
        managerId: 1,
        subscriptionId: sub.id,
        reason: "admin_override",
        adminNote: "Admin huỷ gói ngay lập tức và thu hồi quyền lợi.",
        revokeImmediate: true,
      },
      now
    );

    expect(result.status).toBe("cancelled");
    expect(result.revoke_immediate).toBe(true);

    // Entitlement is cancelled immediately
    const [dbEntitlement] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, user.id));
    expect(dbEntitlement.status).toBe("cancelled");
  });

  it("Scenario: BR-ASC-03 — rejects admin cancel when note is too short (< 20 chars)", async () => {
    await expect(
      adminCancelSubscription({
        managerId: 1,
        subscriptionId: 999,
        reason: "other",
        adminNote: "Ngắn quá",
      })
    ).rejects.toThrowError(RE_INVALID_CANCEL_REASON);
  });

  it("Scenario: BR-RBL-05 — sweeps past due subscriptions and revokes grace period entitlements after limit", async () => {
    const db = getOwnerDb();

    const [user] = await db
      .insert(users)
      .values({
        email: `dunning_user_${Date.now()}@example.com`,
        displayName: "Dunning User",
      })
      .returning();

    const pastDate = new Date(Date.now() - 10 * 86_400_000); // 10 days ago

    const [sub] = await db
      .insert(recurringSubscriptions)
      .values({
        userId: user.id,
        packageCode: "PKG-standard",
        offerCode: "monthly",
        billingPeriod: "monthly",
        priceVnd: 49_000,
        autoRenew: true,
        status: "past_due",
        currentPeriodStart: pastDate,
        currentPeriodEnd: pastDate,
        nextBillingAt: pastDate,
        dunningAttempts: 3,
        consentTermsVersion: "v1.0",
      })
      .returning();

    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "play_standard_games",
      source: "package_order",
      status: "grace_period",
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    const sweepResult = await runDunningSweep(new Date());

    expect(sweepResult.totalProcessed).toBeGreaterThanOrEqual(1);
    expect(sweepResult.expiredCount).toBeGreaterThanOrEqual(1);

    // Sub is cancelled
    const [updatedSub] = await db
      .select()
      .from(recurringSubscriptions)
      .where(eq(recurringSubscriptions.id, sub.id));
    expect(updatedSub.status).toBe("cancelled");

    // Grace period entitlement is cancelled
    const [updatedEntitlement] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, user.id));
    expect(updatedEntitlement.status).toBe("cancelled");
  });
});
