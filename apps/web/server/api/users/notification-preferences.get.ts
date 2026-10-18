import { defineApiRoute } from "#server/utils/define-api-route";
import { getUserNotificationPreferences } from "#server/utils/notification-preferences-runtime";

export default defineApiRoute({
  auth: "user",
  handler: ({ auth: userSession }) => {
    const userId = Number(userSession.user_id);

    return getUserNotificationPreferences(userId);
  },
});
