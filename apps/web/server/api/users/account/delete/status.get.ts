import { defineEventHandler } from "h3";
import { getAccountDeletionStatus } from "#server/services/account-lifecycle-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const userSession = await requireWebUserSession(event);
  return await getAccountDeletionStatus(Number(userSession.user_id));
});
