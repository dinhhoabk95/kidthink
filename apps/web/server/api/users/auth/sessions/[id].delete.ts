import { appError } from "@kidthink/auth";
import { defineEventHandler, getRouterParam, type H3Event } from "h3";
import {
  getUserRefreshService,
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime";

export async function handleDeleteSession(event: H3Event) {
  try {
    const userSession = await requireWebUserSession(event);
    const sessionId = getRouterParam(event, "id") || event.context?.params?.id;

    if (!sessionId) {
      throw appError("VALIDATION_FAILED");
    }

    const refreshService = getUserRefreshService(event);
    await refreshService.revokeSession(sessionId, "user", userSession.user_id);

    return { ok: true };
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
}

export default defineEventHandler((event) => handleDeleteSession(event));
