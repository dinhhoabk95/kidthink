import { NotFoundError } from "@mindkid/errors/common";
import {
  defineEventHandler,
  deleteCookie,
  getCookie,
  getHeader,
  getRouterParam,
} from "h3";
import { archiveChildProfileForUser } from "#server/services/child-service";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  const result = await archiveChildProfileForUser({
    userId: Number(user.user_id),
    childUuid: uuid,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") ?? null,
  });

  if (getCookie(event, "active_child_id") === uuid) {
    deleteCookie(event, "active_child_id", { path: "/" });
  }

  return result;
});
