import { EntitlementRequiredError } from "@mindkid/errors/billing";
import { defineEventHandler, getRouterParam } from "h3";
import { z } from "zod";
import { validateCustomGameRecord } from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

const UuidParamSchema = z.string().trim().min(1);

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);

  const entitlements = await resolveUserActiveEntitlements(userId);
  if (!entitlements.includes("create_custom_game")) {
    throw new EntitlementRequiredError({
      required_entitlement: "create_custom_game",
      message:
        "Tính năng tạo trò chơi tùy chỉnh thuộc gói Add-on Trò chơi tùy chỉnh.",
    });
  }

  const parsedParam = UuidParamSchema.safeParse(getRouterParam(event, "uuid"));
  const uuid = parsedParam.success ? parsedParam.data : "";

  const report = await validateCustomGameRecord(userId, uuid);
  return report;
});
