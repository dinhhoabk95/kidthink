import { defineEventHandler } from "h3";
import { listUserConsents } from "#server/services/consent-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const userSession = requireWebUserSession(event);
  return await listUserConsents(Number(userSession.user_id));
});
