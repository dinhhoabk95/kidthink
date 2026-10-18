import {
  auditLogs,
  entitlements,
  getOwnerDb,
  notifications,
  paymentOrders,
  recurringSubscriptions,
  users,
} from "@mindkid/db";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import {
  DUNNING_GRACE_PERIOD_DAYS,
  DUNNING_MAX_ATTEMPTS,
} from "@mindkid/shared";
import { and, eq, gt, inArray, isNotNull, lt, lte } from "drizzle-orm";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const REMINDER_WINDOW_DAYS = 3;

export type RecurringSubscriptionRow =
  typeof recurringSubscriptions.$inferSelect;

export type RecurringChargeHandler = (
  subscription: RecurringSubscriptionRow
) => Promise<{ paid: boolean; transactionRef?: string }>;

function extractBillingCycleKey(payload: object | null): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const record = payload as Record<string, string | number | boolean | null>;
  return typeof record.billing_cycle_key === "string"
    ? record.billing_cycle_key
    : null;
}

function resolveNextCyclePriceVnd(sub: RecurringSubscriptionRow): number {
  const snapshot = sub.consentSnapshot;
  if (!snapshot || typeof snapshot !== "object") {
    return sub.priceVnd;
  }
  const record = snapshot as Record<string, string | number | boolean | null>;
  if (
    record.price_change_consented === true &&
    typeof record.next_cycle_price_vnd === "number" &&
    record.next_cycle_price_vnd >= 0
  ) {
    return record.next_cycle_price_vnd;
  }
  return sub.priceVnd;
}

function defaultChargeHandler(
  sub: RecurringSubscriptionRow
): Promise<{ paid: boolean; transactionRef?: string }> {
  const snapshot = sub.consentSnapshot;
  if (snapshot && typeof snapshot === "object") {
    const record = snapshot as Record<string, string | number | boolean | null>;
    if (record.auto_charge_ready === true) {
      return Promise.resolve({
        paid: true,
        transactionRef: `AUTO-${sub.id}-${Date.now()}`,
      });
    }
  }
  return Promise.resolve({ paid: false });
}

/**
 * Sweeps pending payment orders older than 48 hours (or expires_at < now)
 * Transitions status: pending -> expired
 * Idempotent (Task 6, D-JL)
 */
export async function runExpirePaymentOrders(
  now = new Date()
): Promise<{ expiredCount: number; orderUuids: string[] }> {
  const db = getOwnerDb();

  const updatedOrders = await db
    .update(paymentOrders)
    .set({
      status: "expired",
      updatedAt: now,
    })
    .where(
      and(
        inArray(paymentOrders.status, ["draft", "pending", "pending_proof"]),
        isNotNull(paymentOrders.expiresAt),
        lt(paymentOrders.expiresAt, now)
      )
    )
    .returning({
      uuid: paymentOrders.uuid,
    });

  return {
    expiredCount: updatedOrders.length,
    orderUuids: updatedOrders.map((o) => o.uuid),
  };
}

/**
 * Sweeps soft_unlock entitlements older than 3 days (expires_at < now)
 * Transitions status: soft_unlock -> expired
 * D-JL: Payment order remains submitted/under_review - only entitlement expires.
 * Idempotent (Task 6)
 */
export async function runExpireSoftUnlockEntitlements(
  now = new Date()
): Promise<{ expiredCount: number; userIds: number[] }> {
  const db = getOwnerDb();

  const updatedRows = await db
    .update(entitlements)
    .set({
      status: "expired",
      updatedAt: now,
    })
    .where(
      and(
        eq(entitlements.status, "soft_unlock"),
        isNotNull(entitlements.expiresAt),
        lt(entitlements.expiresAt, now)
      )
    )
    .returning({
      userId: entitlements.userId,
    });

  const affectedUserIds = [...new Set(updatedRows.map((r) => r.userId))];

  return {
    expiredCount: updatedRows.length,
    userIds: affectedUserIds,
  };
}

/**
 * BR-RBL-02: Sends renewal reminder email 3 days before nextBillingAt.
 * Idempotent per (subscription.id, nextBillingAt).
 */
export async function runRecurringRenewalReminderSweep(
  now = new Date()
): Promise<{ remindedCount: number; skippedCount: number }> {
  const db = getOwnerDb();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * MS_PER_DAY);

  const candidates = await db
    .select({
      sub: recurringSubscriptions,
      userEmail: users.email,
      userDisplayName: users.displayName,
    })
    .from(recurringSubscriptions)
    .innerJoin(users, eq(recurringSubscriptions.userId, users.id))
    .where(
      and(
        eq(recurringSubscriptions.status, "active"),
        eq(recurringSubscriptions.autoRenew, true),
        isNotNull(recurringSubscriptions.nextBillingAt),
        gt(recurringSubscriptions.nextBillingAt, now),
        lte(recurringSubscriptions.nextBillingAt, windowEnd)
      )
    );

  let remindedCount = 0;
  let skippedCount = 0;

  for (const row of candidates) {
    const nextBillingAt = row.sub.nextBillingAt;
    if (!nextBillingAt) {
      continue;
    }

    const cycleKey = `${row.sub.id}:${nextBillingAt.toISOString()}`;

    const existingNotifications = await db
      .select({ payload: notifications.payload })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientType, "user"),
          eq(notifications.recipientId, row.sub.userId),
          eq(notifications.templateCode, "subscription_renewal_reminder")
        )
      );

    const alreadyReminded = existingNotifications.some(
      (n) => extractBillingCycleKey(n.payload as object | null) === cycleKey
    );

    if (alreadyReminded) {
      skippedCount++;
      continue;
    }

    await dispatchTransactionalEmail({
      recipientType: "user",
      recipientId: row.sub.userId,
      code: "subscription_renewal_reminder",
      to: row.userEmail,
      payload: {
        subscription_id: row.sub.id,
        billing_cycle_key: cycleKey,
        display_name: row.userDisplayName,
        package_code: row.sub.packageCode,
        billing_period: row.sub.billingPeriod,
        price_vnd: row.sub.priceVnd,
        next_billing_date: nextBillingAt.toISOString(),
        cancel_url: "/me/subscription",
      },
    });

    remindedCount++;
  }

  return { remindedCount, skippedCount };
}

/**
 * BR-RBL-04, BR-RBL-06: Charges due recurring subscriptions.
 * On success: advances currentPeriodStart/End & nextBillingAt, extends entitlements.
 * On failure: transitions subscription to past_due, schedules retry in 24h, sets entitlements to grace_period.
 */
export async function runRecurringBillingRenewSweep(
  now = new Date(),
  chargeHandler: RecurringChargeHandler = defaultChargeHandler
): Promise<{ renewedCount: number; pastDueCount: number }> {
  const db = getOwnerDb();

  const dueSubs = await db
    .select()
    .from(recurringSubscriptions)
    .where(
      and(
        eq(recurringSubscriptions.status, "active"),
        eq(recurringSubscriptions.autoRenew, true),
        isNotNull(recurringSubscriptions.nextBillingAt),
        lte(recurringSubscriptions.nextBillingAt, now)
      )
    );

  let renewedCount = 0;
  let pastDueCount = 0;

  for (const sub of dueSubs) {
    const outcome = await chargeHandler(sub);

    if (outcome.paid) {
      const periodDays = sub.billingPeriod === "monthly" ? 30 : 365;
      const newPeriodStart = sub.currentPeriodEnd;
      const newPeriodEnd = new Date(
        newPeriodStart.getTime() + periodDays * MS_PER_DAY
      );
      const nextPriceVnd = resolveNextCyclePriceVnd(sub);

      await db.transaction(async (tx) => {
        await tx
          .update(recurringSubscriptions)
          .set({
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: newPeriodEnd,
            nextBillingAt: newPeriodEnd,
            priceVnd: nextPriceVnd,
            dunningAttempts: 0,
            lastDunningAt: null,
            status: "active",
            updatedAt: now,
          })
          .where(eq(recurringSubscriptions.id, sub.id));

        await tx
          .update(entitlements)
          .set({
            status: "active",
            expiresAt: newPeriodEnd,
            updatedAt: now,
          })
          .where(
            and(
              eq(entitlements.userId, sub.userId),
              inArray(entitlements.status, ["active", "grace_period"])
            )
          );

        await tx.insert(auditLogs).values({
          actorType: "system",
          actorId: null,
          action: "subscription.renewed",
          entityType: "recurring_subscription",
          entityId: String(sub.id),
          afterData: {
            subscription_id: sub.id,
            price_vnd: nextPriceVnd,
            current_period_start: newPeriodStart.toISOString(),
            current_period_end: newPeriodEnd.toISOString(),
            transaction_ref: outcome.transactionRef ?? null,
          },
          createdAt: now,
          updatedAt: now,
        });
      });

      renewedCount++;
    } else {
      const retryAt = new Date(now.getTime() + MS_PER_DAY);

      await db.transaction(async (tx) => {
        await tx
          .update(recurringSubscriptions)
          .set({
            status: "past_due",
            dunningAttempts: 1,
            lastDunningAt: now,
            nextBillingAt: retryAt,
            updatedAt: now,
          })
          .where(eq(recurringSubscriptions.id, sub.id));

        await tx
          .update(entitlements)
          .set({
            status: "grace_period",
            updatedAt: now,
          })
          .where(
            and(
              eq(entitlements.userId, sub.userId),
              eq(entitlements.status, "active")
            )
          );
      });

      pastDueCount++;
    }
  }

  return { renewedCount, pastDueCount };
}

/**
 * BR-RBL-04, BR-RBL-05: Sweeps past_due subscriptions.
 * Retries up to 3 attempts within 7-day grace period; otherwise cancels subscription and expires entitlements.
 */
export async function runRecurringDunningSweep(now = new Date()): Promise<{
  totalProcessed: number;
  retriedCount: number;
  expiredCount: number;
}> {
  const db = getOwnerDb();

  return await db.transaction(async (tx) => {
    const pastDueSubs = await tx
      .select()
      .from(recurringSubscriptions)
      .where(
        and(
          eq(recurringSubscriptions.status, "past_due"),
          isNotNull(recurringSubscriptions.nextBillingAt),
          lte(recurringSubscriptions.nextBillingAt, now)
        )
      );

    let retriedCount = 0;
    let expiredCount = 0;

    for (const sub of pastDueSubs) {
      const daysSincePeriodEnd = Math.floor(
        (now.getTime() - sub.currentPeriodEnd.getTime()) / MS_PER_DAY
      );

      if (
        sub.dunningAttempts < DUNNING_MAX_ATTEMPTS &&
        daysSincePeriodEnd <= DUNNING_GRACE_PERIOD_DAYS
      ) {
        const nextRetryAt = new Date(now.getTime() + MS_PER_DAY);
        await tx
          .update(recurringSubscriptions)
          .set({
            dunningAttempts: sub.dunningAttempts + 1,
            lastDunningAt: now,
            nextBillingAt: nextRetryAt,
            updatedAt: now,
          })
          .where(eq(recurringSubscriptions.id, sub.id));
        retriedCount++;
      } else {
        await tx
          .update(recurringSubscriptions)
          .set({
            status: "cancelled",
            autoRenew: false,
            cancelledAt: now,
            cancelledBy: "system",
            cancelReason: "dunning_grace_period_exceeded",
            updatedAt: now,
          })
          .where(eq(recurringSubscriptions.id, sub.id));

        await tx
          .update(entitlements)
          .set({
            status: "expired",
            updatedAt: now,
          })
          .where(
            and(
              eq(entitlements.userId, sub.userId),
              inArray(entitlements.status, ["grace_period", "active"])
            )
          );

        expiredCount++;
      }
    }

    return {
      totalProcessed: pastDueSubs.length,
      retriedCount,
      expiredCount,
    };
  });
}
