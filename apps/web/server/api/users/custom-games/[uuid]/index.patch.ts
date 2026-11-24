import { EntitlementRequiredError } from "@mindkid/errors/billing";
import { updateCustomGameSchema } from "@mindkid/shared";
import { defineEventHandler, getRouterParam } from "h3";
import { updateCustomGame } from "#server/services/index.js";
import { throwValidationError } from "#server/utils/api-error";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import { readRequestBody } from "#server/utils/request-body";

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

  const body = await readRequestBody(event);
  const parsed = updateCustomGameSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const updated = await updateCustomGame(userId, uuid, parsed.data);
  return updated;
});
