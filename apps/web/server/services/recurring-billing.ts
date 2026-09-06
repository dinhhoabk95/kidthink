import {
  auditLogs,
  entitlements,
  getOwnerDb,
  recurringSubscriptions,
} from "@mindkid/db";
import {
  SubscriptionAlreadyCancelledError,
  SubscriptionModelNotFoundError,
} from "@mindkid/errors/billing";
import { ValidationError } from "@mindkid/errors/common";
import {
  type AdminSubscriptionCancelReason,
  canCancelRecurringSubscription,
  DUNNING_GRACE_PERIOD_DAYS,
  DUNNING_MAX_ATTEMPTS,
} from "@mindkid/shared";
import { and, eq, inArray, isNotNull, lt } from "drizzle-orm";

export interface CreateRecurringSubscriptionParams {
  userId: number;
  packageCode: string;
  offerCode: string;
  billingPeriod: "monthly" | "annual";
  priceVnd: number;
  termsVersion: string;
  consentSnapshot?: Record<string, unknown>;
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
) {
  const db = getOwnerDb();

  const periodDays = params.billingPeriod === "monthly" ? 30 : 365;
  const currentPeriodStart = now;
  const currentPeriodEnd = new Date(
    now.getTime() + periodDays * 24 * 60 * 60 * 1000
  );
  const nextBillingAt = currentPeriodEnd;

  const [subscription] = await db
    .insert(recurringSubscriptions)
    .values({
      userId: params.userId,
      packageCode: params.packageCode,
      offerCode: params.offerCode,
      billingPeriod: params.billingPeriod,
      priceVnd: params.priceVnd,
      autoRenew: true,
      status: "active",
      currentPeriodStart,
      currentPeriodEnd,
      nextBillingAt,
      consentTermsVersion: params.termsVersion,
      consentSnapshot: params.consentSnapshot ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return subscription;
}

/**
 * User self-cancels auto-renew.
 * BR-RBL-03: Retains entitlements until the end of the paid period.
 */
export async function userCancelRecurringSubscription(
  userId: number,
  subscriptionId: number,
  now = new Date()
) {
  const db = getOwnerDb();

  return await db.transaction(async (tx) => {
    const [sub] = await tx
      .select()
      .from(recurringSubscriptions)
      .where(
        and(
          eq(recurringSubscriptions.id, subscriptionId),
          eq(recurringSubscriptions.userId, userId)
        )
      )
      .limit(1);

    if (!sub) {
      throw new SubscriptionModelNotFoundError(String(subscriptionId));
    }

    if (!canCancelRecurringSubscription(sub.status)) {
      throw new SubscriptionAlreadyCancelledError(
        "Gói thuê bao định kỳ đã được huỷ trước đó"
      );
    }

    const [updatedSub] = await tx
      .update(recurringSubscriptions)
      .set({
        autoRenew: false,
        status: "cancelled",
        cancelledAt: now,
        cancelledBy: "user",
        cancelReason: "user_self_cancel",
        updatedAt: now,
      })
      .where(eq(recurringSubscriptions.id, sub.id))
      .returning();

    if (!updatedSub) {
      throw new Error("Failed to update subscription");
    }

    // Audit log
    await tx.insert(auditLogs).values({
      actorType: "user",
      actorId: userId,
      action: "subscription.cancelled_by_user",
      entityType: "recurring_subscription",
      entityId: String(sub.id),
      afterData: {
        subscription_id: sub.id,
        auto_renew: false,
        status: "cancelled",
        effective_until: sub.currentPeriodEnd,
      },
      createdAt: now,
    });

    return {
      subscription_id: updatedSub.id,
      status: "cancelled",
      auto_renew: false,
      effective_until: updatedSub.currentPeriodEnd.toISOString(),
    };
  });
}

/**
 * Admin cancels a user's subscription.
 * BR-ASC-01..06
 */
export async function adminCancelSubscription(
  params: AdminCancelSubscriptionParams,
  now = new Date()
) {
  if (!params.adminNote || params.adminNote.trim().length < 20) {
    throw new ValidationError(
      "Ghi chú quản trị huỷ gói bắt buộc tối thiểu 20 ký tự"
    );
  }

  const db = getOwnerDb();

  return await db.transaction(async (tx) => {
    const [sub] = await tx
      .select()
      .from(recurringSubscriptions)
      .where(eq(recurringSubscriptions.id, params.subscriptionId))
      .limit(1);

    if (!sub) {
      throw new SubscriptionModelNotFoundError(String(params.subscriptionId));
    }

    if (sub.status === "cancelled") {
      throw new SubscriptionAlreadyCancelledError(
        "Gói thuê bao định kỳ đã được huỷ trước đó"
      );
    }

    const revokeImmediate = params.revokeImmediate ?? false;

    // 1. Update subscription status
    const [updatedSub] = await tx
      .update(recurringSubscriptions)
      .set({
        autoRenew: false,
        status: "cancelled",
        cancelledAt: now,
        cancelledBy: "admin",
        cancelReason: params.reason,
        cancelNote: params.adminNote,
        updatedAt: now,
      })
      .where(eq(recurringSubscriptions.id, sub.id))
      .returning();

    if (!updatedSub) {
      throw new Error("Failed to update subscription");
    }

    // 2. Handle entitlements according to revoke_immediate
    if (revokeImmediate) {
      await tx
        .update(entitlements)
        .set({
          status: "cancelled",
          updatedAt: now,
        })
        .where(
          and(
            eq(entitlements.userId, sub.userId),
            inArray(entitlements.status, [
              "active",
              "soft_unlock",
              "grace_period",
            ])
          )
        );
    }

    // 3. Write Audit Log
    await tx.insert(auditLogs).values({
      actorType: "manager",
      actorId: params.managerId,
      action: "subscription.cancelled_by_admin",
      entityType: "recurring_subscription",
      entityId: String(sub.id),
      reason: params.adminNote,
      afterData: {
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
      createdAt: now,
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
  });
}

/**
 * Sweeps past_due subscriptions and handles dunning retry or expiry.
 * BR-RBL-04, BR-RBL-05
 */
export async function runDunningSweep(now = new Date()) {
  const db = getOwnerDb();

  return await db.transaction(async (tx) => {
    const pastDueSubs = await tx
      .select()
      .from(recurringSubscriptions)
      .where(
        and(
          eq(recurringSubscriptions.status, "past_due"),
          isNotNull(recurringSubscriptions.nextBillingAt),
          lt(recurringSubscriptions.nextBillingAt, now)
        )
      );

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
        // Retry attempt within grace period
        await tx
          .update(recurringSubscriptions)
          .set({
            dunningAttempts: sub.dunningAttempts + 1,
            lastDunningAt: now,
            updatedAt: now,
          })
          .where(eq(recurringSubscriptions.id, sub.id));
        retriedCount++;
      } else {
        // Exceeded grace period or max attempts -> cancel & revoke
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

        // Revoke entitlements
        await tx
          .update(entitlements)
          .set({
            status: "cancelled",
            updatedAt: now,
          })
          .where(
            and(
              eq(entitlements.userId, sub.userId),
              eq(entitlements.status, "grace_period")
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
