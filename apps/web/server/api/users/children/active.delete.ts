import { defineEventHandler, deleteCookie } from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  await requireWebUserSession(event);
  deleteCookie(event, "active_child_id", { path: "/" });
  return { success: true };
});
