import { appError } from "@mindkid/auth";
import { getOwnerDb, recurringSubscriptions } from "@mindkid/db";
import { desc, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  requireSuperAdminSession(event);

  const idParam = getRouterParam(event, "id");
  const userId = Number(idParam);

  if (!idParam || Number.isNaN(userId) || userId <= 0) {
    throw appError("INVALID_USER_ID", "ID người dùng không hợp lệ");
  }

  const db = getOwnerDb();

  const userSubs = await db
    .select()
    .from(recurringSubscriptions)
    .where(eq(recurringSubscriptions.userId, userId))
    .orderBy(desc(recurringSubscriptions.createdAt));

  return {
    user_id: userId,
    subscriptions: userSubs.map((s) => ({
      id: s.id,
      package_code: s.packageCode,
      offer_code: s.offerCode,
      billing_period: s.billingPeriod,
      price_vnd: s.priceVnd,
      auto_renew: s.autoRenew,
      status: s.status,
      current_period_start: s.currentPeriodStart.toISOString(),
      current_period_end: s.currentPeriodEnd.toISOString(),
      next_billing_at: s.nextBillingAt ? s.nextBillingAt.toISOString() : null,
      dunning_attempts: s.dunningAttempts,
      cancelled_at: s.cancelledAt ? s.cancelledAt.toISOString() : null,
      cancelled_by: s.cancelledBy,
      cancel_reason: s.cancelReason,
      cancel_note: s.cancelNote,
      created_at: s.createdAt.toISOString(),
    })),
  };
});
