import { defineEventHandler } from "h3";
import { getUserSubscriptionOverview } from "#server/services/subscription-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const session = requireWebUserSession(event);
  return await getUserSubscriptionOverview(session.user_id);
});
