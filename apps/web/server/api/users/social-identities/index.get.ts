import { defineEventHandler } from "h3";
import { listUserSocialIdentities } from "#server/services/identity-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const userSession = requireWebUserSession(event);
  return await listUserSocialIdentities(Number(userSession.user_id));
});
