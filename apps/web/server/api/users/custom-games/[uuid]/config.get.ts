import { EntitlementRequiredError } from "@mindkid/errors/billing";
import { defineEventHandler, getQuery, getRouterParam, setHeader } from "h3";
import { z } from "zod";
import { getCustomGamePlayConfig } from "#server/services/index.js";
import {
  getActiveChildUuid,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

const CustomGameConfigQuerySchema = z.object({
  child_uuid: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const uuid = getRouterParam(event, "uuid") || "";

  const entitlements = await resolveUserActiveEntitlements(userId);
  if (!entitlements.includes("create_custom_game")) {
    throw new EntitlementRequiredError({
      required_entitlement: "create_custom_game",
      message:
        "Tính năng tạo trò chơi tùy chỉnh thuộc gói Add-on Trò chơi tùy chỉnh.",
    });
  }

  const parsedQuery = CustomGameConfigQuerySchema.safeParse(
    getQuery(event) || {}
  );
  const query = parsedQuery.success ? parsedQuery.data : {};
  const queryChildUuid =
    typeof query.child_uuid === "string" ? query.child_uuid.trim() : "";
  const contextChildUuid = Reflect.get(event.context, "active_child_uuid");
  const resolvedContextChildUuid =
    typeof contextChildUuid === "string" ? contextChildUuid.trim() : "";

  const childUuid =
    queryChildUuid || resolvedContextChildUuid || getActiveChildUuid(event);

  setHeader(event, "Cache-Control", "private, no-store");

  const config = await getCustomGamePlayConfig(userId, childUuid, uuid);
  return config;
});
