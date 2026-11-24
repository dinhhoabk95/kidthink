import { defineEventHandler } from "h3";
import { listChildrenForUser } from "#server/services/child-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  return await listChildrenForUser(Number(user.user_id));
});
