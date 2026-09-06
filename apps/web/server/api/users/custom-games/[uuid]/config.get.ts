import { NoActiveChildError } from "@mindkid/errors/child";

import { defineEventHandler, getQuery, getRouterParam } from "h3";
import { getCustomGamePlayConfig } from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const uuid = getRouterParam(event, "uuid") || "";
  const query = getQuery(event) || {};

  const childUuid =
    (typeof query.child_uuid === "string" ? query.child_uuid : "") ||
    (event.context as { active_child_uuid?: string })?.active_child_uuid ||
    "";

  if (!childUuid) {
    throw new NoActiveChildError("Hãy chọn hồ sơ bé trước khi tiếp tục.");
  }

  const config = await getCustomGamePlayConfig(userId, childUuid, uuid);
  return config;
});
