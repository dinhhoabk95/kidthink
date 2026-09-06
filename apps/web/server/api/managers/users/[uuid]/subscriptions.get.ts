import { getOwnerDb, recurringSubscriptions, users } from "@mindkid/db";
import { UserNotFoundError } from "@mindkid/errors/account";
import { ValidationError } from "@mindkid/errors/common";
import { desc, eq, or } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

const NUMERIC_REGEX = /^\d+$/;

export default defineEventHandler(async (event) => {
  await requireSuperAdminSession(event);

  const uuidParam =
    getRouterParam(event, "uuid") || getRouterParam(event, "id");
  if (!uuidParam) {
    throw ValidationError.field("uuid", "ID người dùng không hợp lệ");
  }

  const db = getOwnerDb();
  const [targetUser] = await db
    .select({ id: users.id, uuid: users.uuid })
    .from(users)
    .where(
      NUMERIC_REGEX.test(uuidParam)
        ? or(eq(users.id, Number(uuidParam)), eq(users.uuid, uuidParam))
        : eq(users.uuid, uuidParam)
    )
    .limit(1);

  if (!targetUser) {
    throw new UserNotFoundError(uuidParam);
  }

  const userId = targetUser.id;

  const userSubs = await db
    .select()
    .from(recurringSubscriptions)
    .where(eq(recurringSubscriptions.userId, userId))
    .orderBy(desc(recurringSubscriptions.createdAt));

  return {
    user_id: userId,
    user_uuid: targetUser.uuid,
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
