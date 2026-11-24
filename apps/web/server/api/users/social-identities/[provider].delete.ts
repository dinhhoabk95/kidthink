import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getHeader, getRouterParam } from "h3";
import { unlinkUserSocialIdentity } from "#server/services/identity-service";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

const ALLOWED_PROVIDERS = new Set(["google", "facebook"]);

export default defineEventHandler(async (event) => {
  const userSession = requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  requireReauth(event);

  const rawProvider = getRouterParam(event, "provider") || "";
  if (!ALLOWED_PROVIDERS.has(rawProvider)) {
    throw new NotFoundError("Không tìm thấy nhà cung cấp.");
  }

  return await unlinkUserSocialIdentity({
    userId,
    provider: rawProvider,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") || "unknown",
  });
});
