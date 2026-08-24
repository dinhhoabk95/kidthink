import { defineEventHandler, deleteCookie } from "h3";
import {
  assertSameOriginRequest,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  await requireWebUserSession(event);
  assertSameOriginRequest(event);
  deleteCookie(event, "active_child_id", { path: "/" });
  return { success: true };
});
