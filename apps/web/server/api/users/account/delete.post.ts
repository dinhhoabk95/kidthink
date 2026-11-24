import { defineEventHandler, deleteCookie, getHeader } from "h3";
import { requestAccountDeletion } from "#server/services/account-lifecycle-service";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

export default defineEventHandler(async (event) => {
  const userSession = requireWebUserSession(event);
  requireReauth(event);

  const result = await requestAccountDeletion({
    userId: Number(userSession.user_id),
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") ?? null,
  });

  deleteCookie(event, "mindkid-user.session_token", { path: "/" });
  deleteCookie(event, "__Secure-mindkid-user.session_token", {
    path: "/",
    secure: true,
  });
  deleteCookie(event, "active_child_id", { path: "/" });

  return result;
});
