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
  PACKAGE_CATALOG,
} from "@mindkid/shared";
import { and, eq, gt, inArray, isNotNull, lt, lte } from "drizzle-orm";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const REMINDER_WINDOW_DAYS = 3;

export type RecurringSubscriptionRow =
  typeof recurringSubscriptions.$inferSelect;

export type RecurringChargeHandler = (
  subscription: RecurringSubscriptionRow
) => Promise<{ paid?: boolean; ok?: boolean; transactionRef?: string }>;

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
  now = new Date(),
  signal?: AbortSignal
): Promise<{ expiredCount: number; orderUuids: string[] }> {
  if (signal?.aborted) {
    return { expiredCount: 0, orderUuids: [] };
  }
  const db = getOwnerDb();

  const candidateQuery = db
    .select({ id: paymentOrders.id, uuid: paymentOrders.uuid })
    .from(paymentOrders)
    .where(
      and(
        inArray(paymentOrders.status, ["draft", "pending", "pending_proof"]),
        isNotNull(paymentOrders.expiresAt),
        lt(paymentOrders.expiresAt, now)
      )
    );

  const candidates = await candidateQuery.limit(500);

  if (candidates.length === 0 || signal?.aborted) {
    return { expiredCount: 0, orderUuids: [] };
  }

  const ids = candidates.map((o) => o.id);
  const updatedOrders = await db
    .update(paymentOrders)
    .set({
      status: "expired",
      updatedAt: now,
    })
    .where(inArray(paymentOrders.id, ids))
    .returning({
      uuid: paymentOrders.uuid,
    });

  return {
    expiredCount: updatedOrders.length,
    orderUuids: updatedOrders.map((o) => o.uuid),
  };
}

export const expireStalePaymentOrders = runExpirePaymentOrders;

/**
 * Sweeps soft_unlock entitlements older than 3 days (expires_at < now)
 * Transitions status: soft_unlock -> expired
 * D-JL: Payment order remains submitted/under_review - only entitlement expires.
 * Idempotent (Task 6)
 */
export async function runExpireSoftUnlockEntitlements(
  now = new Date(),
  signal?: AbortSignal
): Promise<{ expiredCount: number; userIds: number[] }> {
  if (signal?.aborted) {
    return { expiredCount: 0, userIds: [] };
  }
  const db = getOwnerDb();

  const candidateQuery = db
    .select({ id: entitlements.id, userId: entitlements.userId })
    .from(entitlements)
    .where(
      and(
        eq(entitlements.status, "soft_unlock"),
        isNotNull(entitlements.expiresAt),
        lt(entitlements.expiresAt, now)
      )
    );

  const candidates = await candidateQuery.limit(500);

  if (candidates.length === 0 || signal?.aborted) {
    return { expiredCount: 0, userIds: [] };
  }

  const ids = candidates.map((r) => r.id);
  const updatedRows = await db
    .update(entitlements)
    .set({
      status: "expired",
      updatedAt: now,
    })
    .where(inArray(entitlements.id, ids))
    .returning({
      userId: entitlements.userId,
    });

  const affectedUserIds = [...new Set(updatedRows.map((r) => r.userId))];

  return {
    expiredCount: updatedRows.length,
    userIds: affectedUserIds,
  };
}

export const sweepExpiredEntitlements = runExpireSoftUnlockEntitlements;

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

  const candidateUserIds = Array.from(
    new Set(candidates.map((c) => c.sub.userId))
  );

  const existingNotificationRows =
    candidateUserIds.length > 0
      ? await db
          .select({
            recipientId: notifications.recipientId,
            payload: notifications.payload,
          })
          .from(notifications)
          .where(
            and(
              eq(notifications.recipientType, "user"),
              inArray(notifications.recipientId, candidateUserIds),
              eq(notifications.templateCode, "subscription_renewal_reminder")
            )
          )
      : [];

  const notificationsByUser = new Map<
    number,
    Array<{ payload: object | null }>
  >();
  for (const n of existingNotificationRows) {
    const list = notificationsByUser.get(n.recipientId);
    const item = { payload: n.payload as object | null };
    if (list) {
      list.push(item);
    } else {
      notificationsByUser.set(n.recipientId, [item]);
    }
  }

  for (const row of candidates) {
    const nextBillingAt = row.sub.nextBillingAt;
    if (!nextBillingAt) {
      continue;
    }

    const cycleKey = `${row.sub.id}:${nextBillingAt.toISOString()}`;

    const existingNotifications = notificationsByUser.get(row.sub.userId) || [];

    const alreadyReminded = existingNotifications.some(
      (n) => extractBillingCycleKey(n.payload) === cycleKey
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
    const isPaid = outcome.paid === true || outcome.ok === true;

    const pkg =
      PACKAGE_CATALOG[sub.packageCode as keyof typeof PACKAGE_CATALOG];
    const pkgKeys = pkg ? [...pkg.entitlements] : [];

    if (isPaid) {
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

        const renewConditions = [
          eq(entitlements.userId, sub.userId),
          eq(entitlements.source, "package_order"),
          inArray(entitlements.status, ["active", "grace_period"]),
        ];
        if (pkgKeys.length > 0) {
          renewConditions.push(inArray(entitlements.entitlementKey, pkgKeys));
        }

        await tx
          .update(entitlements)
          .set({
            status: "active",
            expiresAt: newPeriodEnd,
            updatedAt: now,
          })
          .where(and(...renewConditions));

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

        const pastDueConditions = [
          eq(entitlements.userId, sub.userId),
          eq(entitlements.source, "package_order"),
          eq(entitlements.status, "active"),
        ];
        if (pkgKeys.length > 0) {
          pastDueConditions.push(inArray(entitlements.entitlementKey, pkgKeys));
        }

        await tx
          .update(entitlements)
          .set({
            status: "grace_period",
            updatedAt: now,
          })
          .where(and(...pastDueConditions));
      });

      pastDueCount++;
    }
  }

  return { renewedCount, pastDueCount };
}

type WorkerDb = ReturnType<typeof getOwnerDb>;
type WorkerTx = Parameters<Parameters<WorkerDb["transaction"]>[0]>[0];

const defaultDunningChargeHandler: RecurringChargeHandler = () =>
  Promise.resolve({ ok: false, paid: false });

async function handleDunningSuccess(
  tx: WorkerTx,
  sub: RecurringSubscriptionRow,
  pkgKeys: readonly string[],
  chargeResult: { paid?: boolean; ok?: boolean; transactionRef?: string },
  now: Date
): Promise<void> {
  const periodDays = sub.billingPeriod === "monthly" ? 30 : 365;
  const newPeriodStart = sub.currentPeriodEnd;
  const newPeriodEnd = new Date(
    newPeriodStart.getTime() + periodDays * MS_PER_DAY
  );
  const nextPriceVnd = resolveNextCyclePriceVnd(sub);

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

  const entitlementConditions = [
    eq(entitlements.userId, sub.userId),
    eq(entitlements.source, "package_order"),
    inArray(entitlements.status, ["grace_period", "active"]),
  ];
  if (pkgKeys.length > 0) {
    entitlementConditions.push(inArray(entitlements.entitlementKey, pkgKeys));
  }

  await tx
    .update(entitlements)
    .set({
      status: "active",
      expiresAt: newPeriodEnd,
      updatedAt: now,
    })
    .where(and(...entitlementConditions));

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
      transaction_ref: chargeResult.transactionRef ?? null,
    },
    createdAt: now,
    updatedAt: now,
  });
}

async function handleDunningFailure(
  tx: WorkerTx,
  sub: RecurringSubscriptionRow,
  now: Date
): Promise<void> {
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
}

async function handleDunningExpired(
  tx: WorkerTx,
  sub: RecurringSubscriptionRow,
  pkgKeys: readonly string[],
  now: Date
): Promise<void> {
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

  const cancelConditions = [
    eq(entitlements.userId, sub.userId),
    eq(entitlements.source, "package_order"),
    inArray(entitlements.status, ["grace_period", "active"]),
  ];
  if (pkgKeys.length > 0) {
    cancelConditions.push(inArray(entitlements.entitlementKey, pkgKeys));
  }

  await tx
    .update(entitlements)
    .set({
      status: "expired",
      updatedAt: now,
    })
    .where(and(...cancelConditions));
}

function isAbortSignal(
  val: Date | AbortSignal | undefined
): val is AbortSignal {
  return val != null && "aborted" in val;
}

function resolveDunningParams(
  dbOrNow?: WorkerDb | Date,
  maybeNowOrSignal?: Date | AbortSignal,
  chargeHandler?: RecurringChargeHandler,
  maybeSignal?: AbortSignal
): {
  db: WorkerDb;
  now: Date;
  handler: RecurringChargeHandler;
  signal: AbortSignal | undefined;
} {
  const handler = chargeHandler ?? defaultDunningChargeHandler;
  if (dbOrNow instanceof Date) {
    const isSignal = isAbortSignal(maybeNowOrSignal);
    return {
      db: getOwnerDb(),
      now: dbOrNow,
      handler,
      signal: maybeSignal ?? (isSignal ? maybeNowOrSignal : undefined),
    };
  }
  const isSignal = isAbortSignal(maybeNowOrSignal);
  return {
    db: dbOrNow ?? getOwnerDb(),
    now: isSignal || !maybeNowOrSignal ? new Date() : maybeNowOrSignal,
    handler,
    signal: maybeSignal ?? (isSignal ? maybeNowOrSignal : undefined),
  };
}

async function processSingleDunningSub(
  db: WorkerDb,
  sub: typeof recurringSubscriptions.$inferSelect,
  handler: RecurringChargeHandler,
  now: Date
): Promise<"retried" | "expired"> {
  const daysSincePeriodEnd = Math.floor(
    (now.getTime() - sub.currentPeriodEnd.getTime()) / MS_PER_DAY
  );
  const shouldRetry =
    sub.dunningAttempts < DUNNING_MAX_ATTEMPTS &&
    daysSincePeriodEnd <= DUNNING_GRACE_PERIOD_DAYS;

  const chargeResult = shouldRetry ? await handler(sub) : null;

  return await db.transaction(async (tx) => {
    const pkg =
      PACKAGE_CATALOG[sub.packageCode as keyof typeof PACKAGE_CATALOG];
    const pkgKeys = pkg ? [...pkg.entitlements] : [];

    if (shouldRetry && chargeResult) {
      const isSuccess = chargeResult.ok === true || chargeResult.paid === true;
      if (isSuccess) {
        await handleDunningSuccess(tx, sub, pkgKeys, chargeResult, now);
      } else {
        await handleDunningFailure(tx, sub, now);
      }
      return "retried" as const;
    }

    await handleDunningExpired(tx, sub, pkgKeys, now);
    return "expired" as const;
  });
}

/**
 * BR-RBL-04, BR-RBL-05: Sweeps past_due subscriptions.
 * Retries up to 3 attempts within 7-day grace period; otherwise cancels subscription and expires entitlements.
 */
export function runRecurringDunningSweep(
  now?: Date,
  signal?: AbortSignal
): Promise<{
  totalProcessed: number;
  retriedCount: number;
  expiredCount: number;
}>;
export function runRecurringDunningSweep(
  db: WorkerDb,
  now?: Date,
  chargeHandler?: RecurringChargeHandler,
  signal?: AbortSignal
): Promise<{
  totalProcessed: number;
  retriedCount: number;
  expiredCount: number;
}>;
export async function runRecurringDunningSweep(
  dbOrNow?: WorkerDb | Date,
  maybeNowOrSignal?: Date | AbortSignal,
  chargeHandler?: RecurringChargeHandler,
  maybeSignal?: AbortSignal
): Promise<{
  totalProcessed: number;
  retriedCount: number;
  expiredCount: number;
}> {
  const { db, now, handler, signal } = resolveDunningParams(
    dbOrNow,
    maybeNowOrSignal,
    chargeHandler,
    maybeSignal
  );

  const query = db
    .select()
    .from(recurringSubscriptions)
    .where(
      and(
        eq(recurringSubscriptions.status, "past_due"),
        isNotNull(recurringSubscriptions.nextBillingAt),
        lte(recurringSubscriptions.nextBillingAt, now)
      )
    );

  const pastDueSubs = await query.limit(200);

  let retriedCount = 0;
  let expiredCount = 0;

  for (const sub of pastDueSubs) {
    if (signal?.aborted) {
      break;
    }
    const outcome = await processSingleDunningSub(db, sub, handler, now);
    if (outcome === "retried") {
      retriedCount++;
    } else {
      expiredCount++;
    }
  }

  return {
    totalProcessed: pastDueSubs.length,
    retriedCount,
    expiredCount,
  };
}
