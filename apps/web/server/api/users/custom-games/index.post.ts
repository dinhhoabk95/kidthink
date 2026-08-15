import { appError } from "@kidthink/auth";
import { createCustomGame } from "@kidthink/db";
import { createCustomGameSchema } from "@kidthink/shared";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";
import { resolveUserActiveEntitlements } from "../../../utils/entitlements-runtime.js";

export default defineEventHandler(async (event) => {
  try {
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
      throw appError("VALIDATION_FAILED", {
        fields: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    const customGame = await createCustomGame(userId, parsed.data);
    setResponseStatus(event, 201);
    return customGame;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
