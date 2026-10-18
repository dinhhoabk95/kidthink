import { getDb, recurringSubscriptions } from "@mindkid/db";
import { SubscriptionNotFoundError } from "@mindkid/errors/billing";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { userCancelRecurringSubscription } from "#server/services/recurring-billing";
import { defineApiRoute } from "#server/utils/define-api-route";

const cancelRecurringSchema = z
  .object({
    subscription_id: z.number().int().positive().optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .optional()
  .default({});

export default defineApiRoute({
  auth: "user",
  body: cancelRecurringSchema,
  handler: async ({ auth: session, body }) => {
    const db = getDb();
    const { subscription_id, reason } = body ?? {};

    let targetSubscriptionId = subscription_id;

    if (targetSubscriptionId) {
      const [matchingSub] = await db
        .select({ id: recurringSubscriptions.id })
        .from(recurringSubscriptions)
        .where(
          and(
            eq(recurringSubscriptions.id, targetSubscriptionId),
            eq(recurringSubscriptions.userId, session.user_id)
          )
        )
        .limit(1);

      if (!matchingSub) {
        throw new SubscriptionNotFoundError();
      }
    } else {
      const [latestSub] = await db
        .select({ id: recurringSubscriptions.id })
        .from(recurringSubscriptions)
        .where(eq(recurringSubscriptions.userId, session.user_id))
        .orderBy(desc(recurringSubscriptions.id))
        .limit(1);

      if (!latestSub) {
        throw new SubscriptionNotFoundError();
      }
      targetSubscriptionId = latestSub.id;
    }

    const result = await userCancelRecurringSubscription(
      session.user_id,
      targetSubscriptionId,
      new Date(),
      reason
    );

    return {
      ok: true,
      subscription_id: String(result.subscription_id),
      status: result.status,
      auto_renew: false,
      active_until: result.effective_until,
      effective_until: result.effective_until,
    };
  },
});
