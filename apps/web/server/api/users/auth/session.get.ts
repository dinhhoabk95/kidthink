import { defineEventHandler } from "h3";
import {
  ensureUserCsrfCookie,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  ensureUserCsrfCookie(event);
  // Session introspection must apply the same live-session/revocation check
  // as every protected user route; middleware-only JWT verification is not
  // sufficient after logout-all or account suspension.
  return await requireWebUserSession(event);
});
