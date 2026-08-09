import { defineEventHandler } from "h3";
import {
  assertUserSession,
  getActiveChildCandidate,
  getUserRefreshCookie,
  getUserRefreshService,
  respondToUserAuthError,
  setUserAuthCookies,
  validateUserCsrf,
} from "../../../utils/auth-runtime";

export default defineEventHandler(async (event) => {
  try {
    validateUserCsrf(event);
    const service = getUserRefreshService(event);
    const result = await service.rotateRefreshToken({
      refreshToken: getUserRefreshCookie(event),
      activeChildCandidateId: getActiveChildCandidate(event),
    });
    const session = assertUserSession(result.session);
    setUserAuthCookies(event, result.accessToken, result.nextRefreshToken);
    return session;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
