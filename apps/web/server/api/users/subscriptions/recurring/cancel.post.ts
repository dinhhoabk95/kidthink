import { z } from "zod";
import { cancelUserRecurringSubscription } from "#server/services/subscription-service";
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
    const { subscription_id, reason } = body ?? {};
    return await cancelUserRecurringSubscription({
      userId: session.user_id,
      subscriptionId: subscription_id,
      reason,
    });
  },
});
