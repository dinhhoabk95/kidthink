import { defineEventHandler } from "h3";
import {
  assertManagerRefreshRateLimit,
  assertManagerSession,
  getManagerRefreshCookie,
  getManagerRefreshService,
  respondToManagerAuthError,
  setManagerAuthCookies,
  validateManagerCsrf,
} from "../../../utils/auth-runtime";

export default defineEventHandler(async (event) => {
  try {
    validateManagerCsrf(event);
    await assertManagerRefreshRateLimit(event);
    const service = getManagerRefreshService(event);
    const result = await service.rotateRefreshToken({
      refreshToken: getManagerRefreshCookie(event),
    });
    const session = assertManagerSession(result.session);
    setManagerAuthCookies(event, result.accessToken, result.nextRefreshToken);
    return session;
  } catch (error) {
    return respondToManagerAuthError(event, error);
  }
});
