import { appError } from "@mindkid/auth";
import { createCustomGame } from "@mindkid/db";
import { createCustomGameSchema } from "@mindkid/shared";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { throwValidationError } from "#server/utils/api-error";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);

  const entitlements = await resolveUserActiveEntitlements(userId);
  if (!entitlements.includes("create_custom_game")) {
    throw appError("ENTITLEMENT_REQUIRED", {
      required_entitlement: "create_custom_game",
      message:
        "Tính năng tạo trò chơi tùy chỉnh thuộc gói Add-on Trò chơi tùy chỉnh.",
    });
  }

  const eventBody =
    (event.context as { body?: Record<string, unknown> })?.body ||
    (event as { _body?: Record<string, unknown> })._body;
  const body = eventBody || (await readBody(event)) || {};
  const parsed = createCustomGameSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const customGame = await createCustomGame(userId, parsed.data);
  setResponseStatus(event, 201);
  return customGame;
});
