import { NoActiveChildError } from "@mindkid/errors/child";
import { defineEventHandler, getQuery, getRouterParam, setHeader } from "h3";
import { z } from "zod";
import { getCustomGamePlayConfig } from "#server/services/index.js";
import {
  getOptionalActiveChildUuid,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const CustomGameConfigQuerySchema = z.object({
  child_uuid: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const uuid = getRouterParam(event, "uuid") || "";
  const parsedQuery = CustomGameConfigQuerySchema.safeParse(
    getQuery(event) || {}
  );
  const query = parsedQuery.success ? parsedQuery.data : {};

  const childUuid =
    (typeof query.child_uuid === "string" ? query.child_uuid : "") ||
    (event.context as { active_child_uuid?: string })?.active_child_uuid ||
    getOptionalActiveChildUuid(event) ||
    "";

  if (!childUuid) {
    throw new NoActiveChildError("Hãy chọn hồ sơ bé trước khi tiếp tục.");
  }

  setHeader(event, "Cache-Control", "private, no-store");

  const config = await getCustomGamePlayConfig(userId, childUuid, uuid);
  return config;
});
