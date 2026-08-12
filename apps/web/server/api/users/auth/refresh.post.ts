import { enforceTwoAxisRateLimit } from "@kidthink/shared";
import { defineEventHandler } from "h3";
import {
  assertRateLimitAllowed,
  assertUserSession,
  getUserRefreshCookie,
  getUserRefreshService,
  getVerifiedRemoteIp,
  respondToUserAuthError,
  setUserAuthCookies,
  validateUserCsrf,
} from "../../../utils/auth-runtime";

export default defineEventHandler(async (event) => {
  try {
    validateUserCsrf(event);
    const rateLimit = await enforceTwoAxisRateLimit({
      routeClass: "auth:refresh",
      remoteIp: getVerifiedRemoteIp(event),
    });
    assertRateLimitAllowed(rateLimit.statusCode);
    const service = getUserRefreshService(event);
    const result = await service.rotateRefreshToken({
      refreshToken: getUserRefreshCookie(event),
    });
    const session = assertUserSession(result.session);
    setUserAuthCookies(event, result.accessToken, result.nextRefreshToken);
    return session;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
