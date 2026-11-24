import { getUserProfile } from "#server/services/identity-service";
import { defineApiRoute } from "#server/utils/define-api-route";

export default defineApiRoute({
  auth: "user",
  handler: async ({ auth }) => await getUserProfile(Number(auth.user_id)),
});
