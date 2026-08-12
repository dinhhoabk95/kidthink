import { defineEventHandler, type H3Event } from "h3";
import {
  clearUserAuthCookies,
  getUserRefreshService,
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime";

export async function handleLogoutAll(event: H3Event) {
  try {
    const userSession = await requireWebUserSession(event);
    const refreshService = getUserRefreshService(event);

    await refreshService.logoutAll("user", userSession.user_id);

    clearUserAuthCookies(event);
    return { ok: true };
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
}

export default defineEventHandler((event) => handleLogoutAll(event));
