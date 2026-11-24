import { invalidateUserEntitlementsCache } from "@mindkid/cache";
import {
  ACTOR_TYPE,
  ENTITLEMENT_SOURCE,
  ENTITLEMENT_STATUS,
  getOwnerDb,
  type JsonRecord,
  type OwnerDb,
  RECURRING_SUBSCRIPTION_STATUS,
  type RecurringSubscriptionEntity,
} from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import {
  DUNNING_GRACE_PERIOD_DAYS,
  DUNNING_MAX_ATTEMPTS,
  PACKAGE_CATALOG,
} from "@mindkid/shared";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const REMINDER_WINDOW_DAYS = 3;

export type RecurringSubscriptionRow = RecurringSubscriptionEntity;

export type RecurringChargeHandler = (
  subscription: RecurringSubscriptionRow
) => Promise<{ paid?: boolean; ok?: boolean; transactionRef?: string }>;

function extractBillingCycleKey(payload: JsonRecord | null): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  return typeof payload.billing_cycle_key === "string"
    ? payload.billing_cycle_key
    : null;
}

function resolveNextCyclePriceVnd(sub: RecurringSubscriptionRow): number {
  const snapshot = sub.consentSnapshot;
  if (!snapshot || typeof snapshot !== "object") {
    return sub.priceVnd;
  }
  if (
    snapshot.price_change_consented === true &&
    typeof snapshot.next_cycle_price_vnd === "number" &&
    snapshot.next_cycle_price_vnd >= 0
  ) {
    return snapshot.next_cycle_price_vnd;
  }
  return sub.priceVnd;
}

function resolvePackageEntitlementKeys(packageCode: string): string[] {
  const pkg = PACKAGE_CATALOG[packageCode as keyof typeof PACKAGE_CATALOG];
  return pkg ? [...pkg.entitlements] : [];
}

function logUnknownPackageSkip(
  job: "billing:renew" | "billing:dunning-sweep",
  sub: RecurringSubscriptionRow
): void {
  console.warn(
    JSON.stringify({
      level: "warn",
      job,
      event: "unknown_package_skipped",
      subscriptionId: sub.id,
      userId: sub.userId,
      packageCode: sub.packageCode,
    })
  );
}

function defaultChargeHandler(
  sub: RecurringSubscriptionRow
): Promise<{ paid: boolean; transactionRef?: string }> {
  const snapshot = sub.consentSnapshot;
  if (
    snapshot &&
    typeof snapshot === "object" &&
    snapshot.auto_charge_ready === true
  ) {
    return Promise.resolve({
      paid: true,
      transactionRef: `AUTO-${sub.id}-${Date.now()}`,
    });
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
  const repos = createRepositories(getOwnerDb());
  const orderUuids = await repos.orders.expireStaleOrders(now, 500);

  return {
    expiredCount: orderUuids.length,
    orderUuids,
  };
}

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
  const repos = createRepositories(getOwnerDb());
  const result = await repos.entitlements.expireSoftUnlocksDetailed(now, 500);
  for (const userId of result.userIds) {
    await invalidateUserEntitlementsCache(userId);
  }
  return result;
}

/**
 * BR-RBL-02: Sends renewal reminder email 3 days before nextBillingAt.
 * Idempotent per (subscription.id, nextBillingAt).
 */
export async function runRecurringRenewalReminderSweep(
  now = new Date()
): Promise<{ remindedCount: number; skippedCount: number }> {
  const repos = createRepositories(getOwnerDb());
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * MS_PER_DAY);

  const candidates =
    await repos.recurringSubscriptions.listActiveForRenewalReminder(
      now,
      windowEnd
    );

  let remindedCount = 0;
  let skippedCount = 0;

  const candidateUserIds = Array.from(new Set(candidates.map((c) => c.userId)));

  const existingNotificationRows =
    candidateUserIds.length > 0
      ? await repos.notifications.listByUsersAndTemplate(
          candidateUserIds,
          "subscription_renewal_reminder"
        )
      : [];

  const notificationsByUser = new Map<
    number,
    Array<{ payload: JsonRecord | null }>
  >();
  for (const n of existingNotificationRows) {
    const list = notificationsByUser.get(n.recipientId);
    const item = { payload: n.payload };
    if (list) {
      list.push(item);
    } else {
      notificationsByUser.set(n.recipientId, [item]);
    }
  }

  for (const sub of candidates) {
    const nextBillingAt = sub.nextBillingAt;
    if (!nextBillingAt) {
      continue;
    }

    const cycleKey = `${sub.id}:${nextBillingAt.toISOString()}`;

    const existingNotifications = notificationsByUser.get(sub.userId) || [];

    const alreadyReminded = existingNotifications.some(
      (n) => extractBillingCycleKey(n.payload) === cycleKey
    );

    if (alreadyReminded) {
      skippedCount++;
      continue;
    }

    await dispatchTransactionalEmail({
      recipientType: "user",
      recipientId: sub.userId,
      code: "subscription_renewal_reminder",
      to: sub.user.email,
      payload: {
        subscription_id: sub.id,
        billing_cycle_key: cycleKey,
        display_name: sub.user.displayName,
        package_code: sub.packageCode,
        billing_period: sub.billingPeriod,
        price_vnd: sub.priceVnd,
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
  const repos = createRepositories(db);

  const dueSubs = await repos.recurringSubscriptions.listDueForRenewal(now);

  let renewedCount = 0;
  let pastDueCount = 0;

  for (const sub of dueSubs) {
    const pkgKeys = resolvePackageEntitlementKeys(sub.packageCode);
    if (pkgKeys.length === 0) {
      logUnknownPackageSkip("billing:renew", sub);
      continue;
    }

    const outcome = await chargeHandler(sub);
    const isPaid = outcome.paid === true || outcome.ok === true;

    if (isPaid) {
      const periodDays = sub.billingPeriod === "monthly" ? 30 : 365;
      const newPeriodStart = sub.currentPeriodEnd;
      const newPeriodEnd = new Date(
        newPeriodStart.getTime() + periodDays * MS_PER_DAY
      );
      const nextPriceVnd = resolveNextCyclePriceVnd(sub);

      await db.transaction(async (tx) => {
        const txRepos = createRepositories(tx);
        await txRepos.recurringSubscriptions.updateSubscriptionById(sub.id, {
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
          nextBillingAt: newPeriodEnd,
          priceVnd: nextPriceVnd,
          dunningAttempts: 0,
          lastDunningAt: null,
          status: RECURRING_SUBSCRIPTION_STATUS.ACTIVE,
          updatedAt: now,
        });

        await txRepos.entitlements.updateStatusForUserKeys(
          sub.userId,
          {
            source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
            currentStatuses: [
              ENTITLEMENT_STATUS.ACTIVE,
              ENTITLEMENT_STATUS.GRACE_PERIOD,
            ],
            includeExpired: true,
            keys: pkgKeys,
            maxPeriodEnd: newPeriodEnd,
          },
          {
            status: ENTITLEMENT_STATUS.ACTIVE,
            expiresAt: newPeriodEnd,
            now,
          }
        );

        await txRepos.auditLogs.insertLog({
          actorType: ACTOR_TYPE.SYSTEM,
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
        });
      });

      await invalidateUserEntitlementsCache(sub.userId);
      renewedCount++;
    } else {
      const retryAt = new Date(now.getTime() + MS_PER_DAY);
      const graceEnd = new Date(
        now.getTime() + DUNNING_GRACE_PERIOD_DAYS * MS_PER_DAY
      );

      await db.transaction(async (tx) => {
        const txRepos = createRepositories(tx);
        await txRepos.recurringSubscriptions.updateSubscriptionById(sub.id, {
          status: RECURRING_SUBSCRIPTION_STATUS.PAST_DUE,
          dunningAttempts: 1,
          lastDunningAt: now,
          nextBillingAt: retryAt,
          updatedAt: now,
        });

        await txRepos.entitlements.updateStatusForUserKeys(
          sub.userId,
          {
            source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
            currentStatuses: [ENTITLEMENT_STATUS.ACTIVE],
            keys: pkgKeys,
            maxPeriodEnd: sub.currentPeriodEnd,
          },
          {
            status: ENTITLEMENT_STATUS.GRACE_PERIOD,
            expiresAt: graceEnd,
            now,
          }
        );
      });

      await invalidateUserEntitlementsCache(sub.userId);
      pastDueCount++;
    }
  }

  return { renewedCount, pastDueCount };
}

type WorkerDb = OwnerDb;
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
  const txRepos = createRepositories(tx);

  await txRepos.recurringSubscriptions.updateSubscriptionById(sub.id, {
    currentPeriodStart: newPeriodStart,
    currentPeriodEnd: newPeriodEnd,
    nextBillingAt: newPeriodEnd,
    priceVnd: nextPriceVnd,
    dunningAttempts: 0,
    lastDunningAt: null,
    status: RECURRING_SUBSCRIPTION_STATUS.ACTIVE,
    updatedAt: now,
  });

  await txRepos.entitlements.updateStatusForUserKeys(
    sub.userId,
    {
      source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
      currentStatuses: [
        ENTITLEMENT_STATUS.GRACE_PERIOD,
        ENTITLEMENT_STATUS.ACTIVE,
      ],
      includeExpired: true,
      keys: pkgKeys,
      maxPeriodEnd: newPeriodEnd,
    },
    {
      status: ENTITLEMENT_STATUS.ACTIVE,
      expiresAt: newPeriodEnd,
      now,
    }
  );

  await txRepos.auditLogs.insertLog({
    actorType: ACTOR_TYPE.SYSTEM,
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
  });
}

async function handleDunningFailure(
  tx: WorkerTx,
  sub: RecurringSubscriptionRow,
  now: Date
): Promise<void> {
  const nextRetryAt = new Date(now.getTime() + MS_PER_DAY);
  const txRepos = createRepositories(tx);
  await txRepos.recurringSubscriptions.updateSubscriptionById(sub.id, {
    dunningAttempts: sub.dunningAttempts + 1,
    lastDunningAt: now,
    nextBillingAt: nextRetryAt,
    updatedAt: now,
  });
}

async function handleDunningExpired(
  tx: WorkerTx,
  sub: RecurringSubscriptionRow,
  pkgKeys: readonly string[],
  now: Date
): Promise<void> {
  const txRepos = createRepositories(tx);
  await txRepos.recurringSubscriptions.updateSubscriptionById(sub.id, {
    status: RECURRING_SUBSCRIPTION_STATUS.CANCELLED,
    autoRenew: false,
    cancelledAt: now,
    cancelledBy: "system",
    cancelReason: "dunning_grace_period_exceeded",
    updatedAt: now,
  });

  // Renew-fail extends entitlement expiresAt by DUNNING_GRACE_PERIOD_DAYS past lastDunningAt/currentPeriodEnd.
  // Bounding maxPeriodEnd at that grace ceiling expires the dunning row while preserving lifetime (NULL)
  // and longer separately purchased packages.
  const maxGraceEnd = new Date(
    Math.max(
      sub.currentPeriodEnd.getTime(),
      (sub.lastDunningAt ?? sub.currentPeriodEnd).getTime()
    ) +
      DUNNING_GRACE_PERIOD_DAYS * MS_PER_DAY
  );

  await txRepos.entitlements.updateStatusForUserKeys(
    sub.userId,
    {
      source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
      currentStatuses: [
        ENTITLEMENT_STATUS.GRACE_PERIOD,
        ENTITLEMENT_STATUS.ACTIVE,
      ],
      keys: pkgKeys,
      maxPeriodEnd: maxGraceEnd,
    },
    {
      status: ENTITLEMENT_STATUS.EXPIRED,
      now,
    }
  );
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
  sub: RecurringSubscriptionEntity,
  handler: RecurringChargeHandler,
  now: Date
): Promise<"retried" | "expired" | "skipped"> {
  const pkgKeys = resolvePackageEntitlementKeys(sub.packageCode);
  if (pkgKeys.length === 0) {
    logUnknownPackageSkip("billing:dunning-sweep", sub);
    return "skipped";
  }

  const daysSincePeriodEnd = Math.floor(
    (now.getTime() - sub.currentPeriodEnd.getTime()) / MS_PER_DAY
  );
  const shouldRetry =
    sub.dunningAttempts < DUNNING_MAX_ATTEMPTS &&
    daysSincePeriodEnd <= DUNNING_GRACE_PERIOD_DAYS;

  const chargeResult = shouldRetry ? await handler(sub) : null;

  const txOutcome = await db.transaction(async (tx) => {
    if (shouldRetry && chargeResult) {
      const isSuccess = chargeResult.ok === true || chargeResult.paid === true;
      if (isSuccess) {
        await handleDunningSuccess(tx, sub, pkgKeys, chargeResult, now);
      } else {
        await handleDunningFailure(tx, sub, now);
      }
      return {
        outcome: "retried" as const,
        entitlementsMutated: isSuccess,
      };
    }

    await handleDunningExpired(tx, sub, pkgKeys, now);
    return {
      outcome: "expired" as const,
      entitlementsMutated: true,
    };
  });

  if (txOutcome.entitlementsMutated) {
    await invalidateUserEntitlementsCache(sub.userId);
  }

  return txOutcome.outcome;
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

  const repos = createRepositories(db);
  const pastDueSubs = await repos.recurringSubscriptions.listDueForDunning(
    now,
    200
  );

  let retriedCount = 0;
  let expiredCount = 0;

  for (const sub of pastDueSubs) {
    if (signal?.aborted) {
      break;
    }
    const outcome = await processSingleDunningSub(db, sub, handler, now);
    if (outcome === "skipped") {
      continue;
    }
    if (outcome === "retried") {
      retriedCount++;
    } else {
      expiredCount++;
    }
  }

  return {
    totalProcessed: retriedCount + expiredCount,
    retriedCount,
    expiredCount,
  };
}
