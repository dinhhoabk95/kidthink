import {
  entitlementKeys,
  entitlements,
  getOwnerDb,
  notificationDeliveries,
  notifications,
  packages,
  recurringSubscriptions,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  users,
} from "@mindkid/db";
import { enqueue } from "@mindkid/queue";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  runRecurringBillingRenewSweep,
  runRecurringDunningSweep,
  runRecurringRenewalReminderSweep,
} from "#src/services/payment-jobs";

vi.mock("@mindkid/queue", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mindkid/queue")>();
  return { ...actual, enqueue: vi.fn().mockResolvedValue(undefined) };
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe("Recurring Billing Worker Jobs (#292 S3 & S4, BR-RBL-02/04/05/06)", () => {
  beforeEach(async () => {
    vi.mocked(enqueue).mockClear();
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
        status: "active",
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
        status: "active",
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
        status: "active",
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
        status: "active",
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
      source: "package_order",
      status: "active",
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
    expect(updatedSub?.status).toBe("cancelled");
    expect(updatedSub?.autoRenew).toBe(false);

    const [updatedEnt] = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.userId, user.id));
    expect(updatedEnt?.status).toBe("expired");

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
        status: "active",
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
        status: "active",
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
      source: "package_order",
      status: "active",
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
    expect(updatedEnt?.status).toBe("active");
    expect(updatedEnt?.expiresAt?.getTime()).toBe(expectedNewEnd.getTime());

    await db.delete(entitlements).where(eq(entitlements.userId, user.id));
    await db
      .delete(recurringSubscriptions)
      .where(eq(recurringSubscriptions.id, sub.id));
    await db.delete(users).where(eq(users.id, user.id));
  });
});
