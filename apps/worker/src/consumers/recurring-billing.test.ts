import { invalidateUserEntitlementsCache } from "@mindkid/cache";
import {
  ENTITLEMENT_SOURCE,
  ENTITLEMENT_STATUS,
  entitlementKeys,
  entitlements,
  getOwnerDb,
  notificationDeliveries,
  notifications,
  packages,
  RECURRING_SUBSCRIPTION_STATUS,
  recurringSubscriptions,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  USER_STATUS,
  users,
} from "@mindkid/db";
import { enqueue } from "@mindkid/queue";
import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  runRecurringBillingRenewSweep,
  runRecurringDunningSweep,
  runRecurringRenewalReminderSweep,
} from "#src/services/payment-jobs";
import { runExpireEntitlements } from "#src/services/rollup";

vi.mock("@mindkid/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/cache")>();
  return {
    ...actual,
    invalidateUserEntitlementsCache: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@mindkid/queue", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/queue")>();
  return { ...actual, enqueue: vi.fn().mockResolvedValue(undefined) };
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe("Recurring Billing Worker Jobs (#292 S3 & S4, BR-RBL-02/04/05/06)", () => {
  beforeEach(async () => {
    vi.mocked(enqueue).mockClear();
    vi.mocked(invalidateUserEntitlementsCache).mockClear();
    const db = getOwnerDb();
    for (const k of SEED_ENTITLEMENT_KEYS) {
      await db.insert(entitlementKeys).values(k).onConflictDoNothing();
    }
    for (const pkg of SEED_PACKAGES) {
      await db.insert(packages).values(pkg).onConflictDoNothing();
    }
  });

  it("S3 (BR-RBL-02): billing:renewal-reminder sends 1 email for subscription due in 3 days and skips duplicate on rerun", async () => {
    const db = getOwnerDb();
    const now = new Date("2026-10-18T08:00:00.000Z");
    const dueInTwoDays = new Date(now.getTime() + 2 * MS_PER_DAY);

    const [user] = await db
      .insert(users)
      .values({
        email: `reminder_${Date.now()}@example.com`,
        displayName: "Reminder Parent",
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    const [sub] = await db
      .insert(recurringSubscriptions)
      .values({
        userId: user.id,
        packageCode: "PKG-standard",
        offerCode: "annual",
        billingPeriod: "annual",
        priceVnd: 490_000,
        autoRenew: true,
        status: RECURRING_SUBSCRIPTION_STATUS.ACTIVE,
        currentPeriodStart: new Date(now.getTime() - 363 * MS_PER_DAY),
        currentPeriodEnd: dueInTwoDays,
        nextBillingAt: dueInTwoDays,
        consentTermsVersion: "v1.0",
      })
      .returning();
    if (!sub) {
      throw new Error("Failed to insert subscription");
    }

    const firstRun = await runRecurringRenewalReminderSweep(now);
    expect(firstRun.remindedCount).toBeGreaterThanOrEqual(1);

    const secondRun = await runRecurringRenewalReminderSweep(now);
    expect(secondRun.remindedCount).toBe(0);
    expect(secondRun.skippedCount).toBeGreaterThanOrEqual(1);

    const userNotifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, user.id));
    expect(userNotifs).toHaveLength(1);
    expect(userNotifs[0]?.templateCode).toBe("subscription_renewal_reminder");

    await db
      .delete(notificationDeliveries)
      .where(eq(notificationDeliveries.notificationId, userNotifs[0]?.id ?? 0));
    await db
      .delete(notifications)
      .where(eq(notifications.recipientId, user.id));
    await db
      .delete(recurringSubscriptions)
      .where(eq(recurringSubscriptions.id, sub.id));
    await db.delete(users).where(eq(users.id, user.id));
  });

  it("S4 (BR-RBL-04, BR-RBL-05): billing:renew & billing:dunning-sweep retry up to 3 times in 7 days then cancel & expire entitlements", async () => {
    const db = getOwnerDb();
    const periodEnd = new Date("2026-10-01T00:00:00.000Z");

    const [user] = await db
      .insert(users)
      .values({
        email: `dunning_cycle_${Date.now()}@example.com`,
        displayName: "Dunning Parent",
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    const [sub] = await db
      .insert(recurringSubscriptions)
      .values({
        userId: user.id,
        packageCode: "PKG-standard",
        offerCode: "monthly",
        billingPeriod: "monthly",
        priceVnd: 69_000,
        autoRenew: true,
        status: RECURRING_SUBSCRIPTION_STATUS.ACTIVE,
        currentPeriodStart: new Date(periodEnd.getTime() - 30 * MS_PER_DAY),
        currentPeriodEnd: periodEnd,
        nextBillingAt: periodEnd,
        consentTermsVersion: "v1.0",
      })
      .returning();
    if (!sub) {
      throw new Error("Failed to insert subscription");
    }

    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "play_standard_games",
      source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
      status: ENTITLEMENT_STATUS.ACTIVE,
      expiresAt: periodEnd,
    });

    // Attempt 1 fails on due date -> past_due (dunningAttempts = 1), entitlement -> grace_period
    const renewRes = await runRecurringBillingRenewSweep(
      periodEnd,
      async () => ({
        paid: false,
      })
    );
    expect(renewRes.pastDueCount).toBeGreaterThanOrEqual(1);

    // Attempt 2 (day 2) -> dunningAttempts = 2
    const day2 = new Date(periodEnd.getTime() + 2 * MS_PER_DAY);
    const sweep1 = await runRecurringDunningSweep(day2);
    expect(sweep1.retriedCount).toBeGreaterThanOrEqual(1);

    // Attempt 3 (day 4) -> dunningAttempts = 3
    const day4 = new Date(periodEnd.getTime() + 4 * MS_PER_DAY);
    const sweep2 = await runRecurringDunningSweep(day4);
    expect(sweep2.retriedCount).toBeGreaterThanOrEqual(1);

    // Day 8 (> 7 days grace period and 3 attempts) -> cancelled + entitlement expired
    const day8 = new Date(periodEnd.getTime() + 8 * MS_PER_DAY);
    const sweepFinal = await runRecurringDunningSweep(day8);
    expect(sweepFinal.expiredCount).toBeGreaterThanOrEqual(1);

    const [updatedSub] = await db
      .select()
      .from(recurringSubscriptions)
      .where(eq(recurringSubscriptions.id, sub.id));
    expect(updatedSub?.status).toBe(RECURRING_SUBSCRIPTION_STATUS.CANCELLED);
    expect(updatedSub?.autoRenew).toBe(false);

    const [updatedEnt] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, user.id));
    expect(updatedEnt?.status).toBe(ENTITLEMENT_STATUS.EXPIRED);

    await db.delete(entitlements).where(eq(entitlements.userId, user.id));
    await db
      .delete(recurringSubscriptions)
      .where(eq(recurringSubscriptions.id, sub.id));
    await db.delete(users).where(eq(users.id, user.id));
  });

  it("S4 (BR-RBL-06): billing:renew advances current_period_* and extends entitlements when charge succeeds", async () => {
    const db = getOwnerDb();
    const periodEnd = new Date("2026-10-15T00:00:00.000Z");

    const [user] = await db
      .insert(users)
      .values({
        email: `renew_ok_${Date.now()}@example.com`,
        displayName: "Renew Success Parent",
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    const [sub] = await db
      .insert(recurringSubscriptions)
      .values({
        userId: user.id,
        packageCode: "PKG-standard",
        offerCode: "monthly",
        billingPeriod: "monthly",
        priceVnd: 69_000,
        autoRenew: true,
        status: RECURRING_SUBSCRIPTION_STATUS.ACTIVE,
        currentPeriodStart: new Date(periodEnd.getTime() - 30 * MS_PER_DAY),
        currentPeriodEnd: periodEnd,
        nextBillingAt: periodEnd,
        consentTermsVersion: "v1.0",
      })
      .returning();
    if (!sub) {
      throw new Error("Failed to insert subscription");
    }

    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "play_standard_games",
      source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
      status: ENTITLEMENT_STATUS.ACTIVE,
      expiresAt: periodEnd,
    });

    const renewRes = await runRecurringBillingRenewSweep(
      periodEnd,
      async () => ({
        paid: true,
        transactionRef: "TXN-RENEW-001",
      })
    );
    expect(renewRes.renewedCount).toBeGreaterThanOrEqual(1);

    const expectedNewEnd = new Date(periodEnd.getTime() + 30 * MS_PER_DAY);
    const [updatedSub] = await db
      .select()
      .from(recurringSubscriptions)
      .where(eq(recurringSubscriptions.id, sub.id));
    expect(updatedSub?.currentPeriodStart.getTime()).toBe(periodEnd.getTime());
    expect(updatedSub?.currentPeriodEnd.getTime()).toBe(
      expectedNewEnd.getTime()
    );

    const [updatedEnt] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, user.id));
    expect(updatedEnt?.status).toBe(ENTITLEMENT_STATUS.ACTIVE);
    expect(updatedEnt?.expiresAt?.getTime()).toBe(expectedNewEnd.getTime());

    await db.delete(entitlements).where(eq(entitlements.userId, user.id));
    await db
      .delete(recurringSubscriptions)
      .where(eq(recurringSubscriptions.id, sub.id));
    await db.delete(users).where(eq(users.id, user.id));
  });

  it("#30: skips unknown packageCode safely, preserves lifetime/longer rows, restores EXPIRED rows, and invalidates entitlements cache", async () => {
    const db = getOwnerDb();
    const periodEnd = new Date("2026-10-15T00:00:00.000Z");

    const [unknownUser] = await db
      .insert(users)
      .values({
        email: `unknown_pkg_${Date.now()}@example.com`,
        displayName: "Unknown Pkg Parent",
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    if (!unknownUser) {
      throw new Error("Failed to insert unknownUser");
    }

    await db.insert(packages).values({
      code: "PKG-unknown-test",
      name: "Unknown Test",
      audience: "parent",
      offers: [],
    });

    const [unknownSub] = await db
      .insert(recurringSubscriptions)
      .values({
        userId: unknownUser.id,
        packageCode: "PKG-unknown-test",
        offerCode: "monthly",
        billingPeriod: "monthly",
        priceVnd: 69_000,
        autoRenew: true,
        status: RECURRING_SUBSCRIPTION_STATUS.ACTIVE,
        currentPeriodStart: new Date(periodEnd.getTime() - 30 * MS_PER_DAY),
        currentPeriodEnd: periodEnd,
        nextBillingAt: periodEnd,
        consentTermsVersion: "v1.0",
      })
      .returning();

    await db.insert(entitlements).values({
      userId: unknownUser.id,
      entitlementKey: "play_standard_games",
      source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
      status: ENTITLEMENT_STATUS.ACTIVE,
      expiresAt: periodEnd,
    });

    const [user] = await db
      .insert(users)
      .values({
        email: `renew_guard_${Date.now()}@example.com`,
        displayName: "Renew Guard Parent",
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    if (!user) {
      throw new Error("Failed to insert user");
    }

    const [sub] = await db
      .insert(recurringSubscriptions)
      .values({
        userId: user.id,
        packageCode: "PKG-standard",
        offerCode: "monthly",
        billingPeriod: "monthly",
        priceVnd: 69_000,
        autoRenew: true,
        status: RECURRING_SUBSCRIPTION_STATUS.ACTIVE,
        currentPeriodStart: new Date(periodEnd.getTime() - 30 * MS_PER_DAY),
        currentPeriodEnd: periodEnd,
        nextBillingAt: periodEnd,
        consentTermsVersion: "v1.0",
      })
      .returning();
    if (!sub) {
      throw new Error("Failed to insert subscription");
    }

    const [lifetimeUser] = await db
      .insert(users)
      .values({
        email: `lifetime_${Date.now()}@example.com`,
        displayName: "Lifetime Parent",
        status: USER_STATUS.ACTIVE,
      })
      .returning();
    if (!lifetimeUser) {
      throw new Error("Failed to insert lifetimeUser");
    }

    const [lifetimeSub] = await db
      .insert(recurringSubscriptions)
      .values({
        userId: lifetimeUser.id,
        packageCode: "PKG-standard",
        offerCode: "monthly",
        billingPeriod: "monthly",
        priceVnd: 69_000,
        autoRenew: true,
        status: RECURRING_SUBSCRIPTION_STATUS.ACTIVE,
        currentPeriodStart: new Date(periodEnd.getTime() - 30 * MS_PER_DAY),
        currentPeriodEnd: periodEnd,
        nextBillingAt: periodEnd,
        consentTermsVersion: "v1.0",
      })
      .returning();
    if (!lifetimeSub) {
      throw new Error("Failed to insert lifetimeSub");
    }

    // User 1 has an EXPIRED entitlement (e.g. swept slightly before renew) that should be restored
    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "play_standard_games",
      source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
      status: ENTITLEMENT_STATUS.EXPIRED,
      expiresAt: periodEnd,
    });

    // Lifetime user has a NULL expiresAt entitlement that must remain untouched
    await db.insert(entitlements).values({
      userId: lifetimeUser.id,
      entitlementKey: "play_standard_games",
      source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
      status: ENTITLEMENT_STATUS.ACTIVE,
      expiresAt: null,
    });

    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const chargeHandler = vi.fn().mockResolvedValue({
      paid: true,
      transactionRef: "TXN-GUARD-01",
    });

    try {
      const renewRes = await runRecurringBillingRenewSweep(
        periodEnd,
        chargeHandler
      );
      expect(renewRes.renewedCount).toBe(2);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    } finally {
      warnSpy.mockRestore();
    }

    // Unknown package user's entitlement must remain untouched
    const [untouchedUnknownEnt] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, unknownUser.id));
    expect(untouchedUnknownEnt?.status).toBe(ENTITLEMENT_STATUS.ACTIVE);
    expect(untouchedUnknownEnt?.expiresAt?.getTime()).toBe(periodEnd.getTime());

    // Previously EXPIRED row was restored to ACTIVE with newPeriodEnd
    const expectedNewEnd = new Date(periodEnd.getTime() + 30 * MS_PER_DAY);
    const [restoredEnt] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, user.id));
    expect(restoredEnt?.status).toBe(ENTITLEMENT_STATUS.ACTIVE);
    expect(restoredEnt?.expiresAt?.getTime()).toBe(expectedNewEnd.getTime());

    // Lifetime row was preserved (expiresAt remains null)
    const [preservedLifetime] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, lifetimeUser.id));
    expect(preservedLifetime?.status).toBe(ENTITLEMENT_STATUS.ACTIVE);
    expect(preservedLifetime?.expiresAt).toBeNull();

    expect(invalidateUserEntitlementsCache).toHaveBeenCalledWith(user.id);
    expect(invalidateUserEntitlementsCache).toHaveBeenCalledWith(
      lifetimeUser.id
    );
    expect(invalidateUserEntitlementsCache).not.toHaveBeenCalledWith(
      unknownUser.id
    );

    // Also test runExpireEntitlements cache invalidation for distinct userIds
    vi.mocked(invalidateUserEntitlementsCache).mockClear();
    await db
      .update(entitlements)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(
        and(
          eq(entitlements.userId, user.id),
          eq(entitlements.entitlementKey, "play_standard_games")
        )
      );
    const expireRes = await runExpireEntitlements();
    expect(expireRes.expiredCount).toBeGreaterThanOrEqual(1);
    expect(invalidateUserEntitlementsCache).toHaveBeenCalledWith(user.id);
    expect(invalidateUserEntitlementsCache).not.toHaveBeenCalledWith(
      lifetimeUser.id
    );

    await db
      .delete(entitlements)
      .where(eq(entitlements.userId, unknownUser.id));
    if (unknownSub) {
      await db
        .delete(recurringSubscriptions)
        .where(eq(recurringSubscriptions.id, unknownSub.id));
    }
    await db.delete(users).where(eq(users.id, unknownUser.id));
    await db.delete(packages).where(eq(packages.code, "PKG-unknown-test"));

    await db.delete(entitlements).where(eq(entitlements.userId, user.id));
    await db
      .delete(recurringSubscriptions)
      .where(eq(recurringSubscriptions.id, sub.id));
    await db.delete(users).where(eq(users.id, user.id));

    await db
      .delete(entitlements)
      .where(eq(entitlements.userId, lifetimeUser.id));
    await db
      .delete(recurringSubscriptions)
      .where(eq(recurringSubscriptions.id, lifetimeSub.id));
    await db.delete(users).where(eq(users.id, lifetimeUser.id));
  });
});
