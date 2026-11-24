import { writeAudit } from "@mindkid/audit";
import {
  type DbExecutor,
  ENTITLEMENT_SOURCE,
  ENTITLEMENT_STATUS,
  RECURRING_SUBSCRIPTION_STATUS,
  RECURRING_SUBSCRIPTION_STATUS_CODEC,
  type RecurringSubscriptionEntity,
} from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import {
  InvalidCancelReasonError,
  SubscriptionAlreadyCancelledError,
  SubscriptionModelNotFoundError,
} from "@mindkid/errors/billing";
import {
  ADMIN_SUBSCRIPTION_CANCEL_REASONS,
  type AdminSubscriptionCancelReason,
  canCancelRecurringSubscription,
  DUNNING_GRACE_PERIOD_DAYS,
  DUNNING_MAX_ATTEMPTS,
  PACKAGE_CATALOG,
} from "@mindkid/shared";
import { invalidateUserEntitlementsCache } from "#server/utils/entitlements-runtime";
import { useOwnerRepositories } from "#server/utils/repositories";

export interface CreateRecurringSubscriptionParams {
  userId: number;
  packageCode: string;
  offerCode: string;
  billingPeriod: "monthly" | "annual";
  priceVnd: number;
  termsVersion: string;
  consentSnapshot?: Record<string, string | number | boolean | null>;
}

export interface AdminCancelSubscriptionParams {
  managerId: number;
  subscriptionId: number;
  reason: AdminSubscriptionCancelReason;
  adminNote: string;
  revokeImmediate?: boolean;
}

/**
 * Create a new recurring subscription with snapshot consent.
 * BR-RBL-01, BR-RBL-02
 */
export async function createRecurringSubscription(
  params: CreateRecurringSubscriptionParams,
  now = new Date()
): Promise<RecurringSubscriptionEntity> {
  const repos = useOwnerRepositories();

  const periodDays = params.billingPeriod === "monthly" ? 30 : 365;
  const currentPeriodStart = now;
  const currentPeriodEnd = new Date(
    now.getTime() + periodDays * 24 * 60 * 60 * 1000
  );
  const nextBillingAt = currentPeriodEnd;

  return await repos.recurringSubscriptions.createSubscription({
    userId: params.userId,
    packageCode: params.packageCode,
    offerCode: params.offerCode,
    billingPeriod: params.billingPeriod,
    priceVnd: params.priceVnd,
    autoRenew: true,
    currentPeriodStart,
    currentPeriodEnd,
    nextBillingAt,
    consentTermsVersion: params.termsVersion,
    consentSnapshot: params.consentSnapshot ?? null,
    now,
  });
}

/**
 * User self-cancels auto-renew.
 * BR-RBL-03: Retains entitlements until the end of the paid period.
 */
export async function userCancelRecurringSubscription(
  userId: number,
  subscriptionId: number,
  now = new Date(),
  reason?: string
) {
  const repos = useOwnerRepositories();

  return await repos.recurringSubscriptions.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const sub = await txRepos.recurringSubscriptions.findByIdForUser(
      subscriptionId,
      userId
    );

    if (!sub) {
      throw new SubscriptionModelNotFoundError(String(subscriptionId));
    }

    if (
      !canCancelRecurringSubscription(
        RECURRING_SUBSCRIPTION_STATUS_CODEC.toLabel(sub.status)
      )
    ) {
      throw new SubscriptionAlreadyCancelledError(
        "Gói thuê bao định kỳ đã được huỷ trước đó"
      );
    }

    const cancelReason = reason?.trim() ? reason.trim() : "user_self_cancel";

    const updatedSub =
      await txRepos.recurringSubscriptions.updateSubscriptionById(sub.id, {
        autoRenew: false,
        status: RECURRING_SUBSCRIPTION_STATUS.CANCELLED,
        cancelledAt: now,
        cancelledBy: "user",
        cancelReason,
        updatedAt: now,
      });

    if (!updatedSub) {
      throw new Error("Failed to update subscription");
    }

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: userId,
      action: "subscription.cancelled_by_user",
      entity_type: "recurring_subscription",
      entity_id: String(sub.id),
      after_data: {
        subscription_id: sub.id,
        auto_renew: false,
        status: "cancelled",
        effective_until: sub.currentPeriodEnd,
      },
    });

    return {
      subscription_id: updatedSub.id,
      status: "cancelled",
      auto_renew: false,
      effective_until: updatedSub.currentPeriodEnd.toISOString(),
    };
  });
}

async function revokeSubEntitlements(
  tx: DbExecutor,
  userId: number,
  packageCode: string,
  now: Date
): Promise<void> {
  const txRepos = createRepositories(tx);
  const pkg = PACKAGE_CATALOG[packageCode as keyof typeof PACKAGE_CATALOG];
  const pkgKeys = pkg ? [...pkg.entitlements] : [];
  if (pkgKeys.length === 0) {
    return;
  }
  await txRepos.entitlements.updateStatusForUserKeys(
    userId,
    {
      source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
      currentStatuses: [
        ENTITLEMENT_STATUS.ACTIVE,
        ENTITLEMENT_STATUS.SOFT_UNLOCK,
        ENTITLEMENT_STATUS.GRACE_PERIOD,
      ],
      keys: pkgKeys,
    },
    {
      status: ENTITLEMENT_STATUS.CANCELLED,
      now,
    }
  );
}

/**
 * Admin cancels a user's subscription.
 * BR-ASC-01..06
 */
export async function adminCancelSubscription(
  params: AdminCancelSubscriptionParams,
  now = new Date()
) {
  if (
    !(
      ADMIN_SUBSCRIPTION_CANCEL_REASONS.includes(params.reason) &&
      params.adminNote
    ) ||
    params.adminNote.trim().length < 20
  ) {
    throw new InvalidCancelReasonError(
      "INVALID_CANCEL_REASON: Ghi chú quản trị huỷ gói bắt buộc tối thiểu 20 ký tự"
    );
  }

  const repos = useOwnerRepositories();
  let cancelledUserId = 0;

  const cancelResult = await repos.recurringSubscriptions.transaction(
    async (tx) => {
      const txRepos = createRepositories(tx);
      const sub = await txRepos.recurringSubscriptions.findById(
        params.subscriptionId
      );

      if (!sub) {
        throw new SubscriptionModelNotFoundError(String(params.subscriptionId));
      }

      if (sub.status === RECURRING_SUBSCRIPTION_STATUS.CANCELLED) {
        throw new SubscriptionAlreadyCancelledError(
          "Gói thuê bao định kỳ đã được huỷ trước đó"
        );
      }

      const revokeImmediate = params.revokeImmediate ?? false;

      const updatedSub =
        await txRepos.recurringSubscriptions.updateSubscriptionById(sub.id, {
          autoRenew: false,
          status: RECURRING_SUBSCRIPTION_STATUS.CANCELLED,
          cancelledAt: now,
          cancelledBy: "admin",
          cancelReason: params.reason,
          cancelNote: params.adminNote,
          updatedAt: now,
        });

      if (!updatedSub) {
        throw new Error("Failed to update subscription");
      }

      if (revokeImmediate) {
        cancelledUserId = sub.userId;
        await revokeSubEntitlements(tx, sub.userId, sub.packageCode, now);
      }

      await writeAudit(tx, {
        actor_type: "manager",
        actor_id: params.managerId,
        action: "subscription.cancelled_by_admin",
        entity_type: "recurring_subscription",
        entity_id: String(sub.id),
        reason: params.adminNote,
        after_data: {
          subscription_id: sub.id,
          user_id: sub.userId,
          reason: params.reason,
          admin_note: params.adminNote,
          revoke_immediate: revokeImmediate,
          status: "cancelled",
          effective_until: revokeImmediate
            ? now.toISOString()
            : sub.currentPeriodEnd.toISOString(),
        },
      });

      return {
        subscription_id: updatedSub.id,
        status: "cancelled",
        auto_renew: false,
        revoke_immediate: revokeImmediate,
        effective_until: revokeImmediate
          ? now.toISOString()
          : updatedSub.currentPeriodEnd.toISOString(),
      };
    }
  );

  if (cancelledUserId > 0) {
    await invalidateUserEntitlementsCache(cancelledUserId);
  }

  return cancelResult;
}

/**
 * Sweeps past_due subscriptions and handles dunning retry or expiry.
 * BR-RBL-04, BR-RBL-05
 */
export async function runDunningSweep(now = new Date()) {
  const repos = useOwnerRepositories();
  const expiredUserIds = new Set<number>();

  const summary = await repos.recurringSubscriptions.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const pastDueSubs =
      await txRepos.recurringSubscriptions.listDueForDunning(now);

    let retriedCount = 0;
    let expiredCount = 0;

    for (const sub of pastDueSubs) {
      const daysSincePeriodEnd = Math.floor(
        (now.getTime() - sub.currentPeriodEnd.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (
        sub.dunningAttempts < DUNNING_MAX_ATTEMPTS &&
        daysSincePeriodEnd <= DUNNING_GRACE_PERIOD_DAYS
      ) {
        await txRepos.recurringSubscriptions.updateSubscriptionById(sub.id, {
          dunningAttempts: sub.dunningAttempts + 1,
          lastDunningAt: now,
          updatedAt: now,
        });
        retriedCount++;
      } else {
        await txRepos.recurringSubscriptions.updateSubscriptionById(sub.id, {
          status: RECURRING_SUBSCRIPTION_STATUS.CANCELLED,
          autoRenew: false,
          cancelledAt: now,
          cancelledBy: "system",
          cancelReason: "dunning_grace_period_exceeded",
          updatedAt: now,
        });

        const pkg =
          PACKAGE_CATALOG[sub.packageCode as keyof typeof PACKAGE_CATALOG];
        const pkgKeys = pkg ? [...pkg.entitlements] : [];
        if (pkgKeys.length > 0) {
          await txRepos.entitlements.updateStatusForUserKeys(
            sub.userId,
            {
              source: ENTITLEMENT_SOURCE.PACKAGE_ORDER,
              currentStatuses: [ENTITLEMENT_STATUS.GRACE_PERIOD],
              keys: pkgKeys,
            },
            {
              status: ENTITLEMENT_STATUS.CANCELLED,
              now,
            }
          );
        }

        expiredUserIds.add(sub.userId);
        expiredCount++;
      }
    }

    return {
      totalProcessed: pastDueSubs.length,
      retriedCount,
      expiredCount,
    };
  });

  for (const userId of expiredUserIds) {
    await invalidateUserEntitlementsCache(userId);
  }

  return summary;
}
