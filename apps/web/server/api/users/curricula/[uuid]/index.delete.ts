import { deletePersonalCurriculum } from "@mindkid/db";
import {
  defineEventHandler,
  getRequestHeader,
  getRequestIP,
  getRouterParam,
} from "h3";
import { requireWebUserSession } from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
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
});
