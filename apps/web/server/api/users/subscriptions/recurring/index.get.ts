import { getUserRecurringSubscription } from "#server/services/subscription-service";
import { defineApiRoute } from "#server/utils/define-api-route";

export default defineApiRoute({
  auth: "user",
  handler: async ({ auth: session }) =>
    await getUserRecurringSubscription(session.user_id),
});
