import { deletePersonalCurriculum } from "@kidthink/db";
import {
  defineEventHandler,
  getRequestHeader,
  getRequestIP,
  getRouterParam,
} from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const userId = Number(user.user_id);
    const uuid = getRouterParam(event, "uuid") || "";

    const result = await deletePersonalCurriculum(
      {
        userId,
        ip: getRequestIP(event),
        userAgent: getRequestHeader(event, "user-agent"),
      },
      uuid
    );

    return result;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
