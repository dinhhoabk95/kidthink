import { appError } from "@kidthink/auth";
import { refreshLessonPlanItem } from "@kidthink/db";
import { RefreshLessonPlanItemSchema } from "@kidthink/shared";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";
import { resolveUserActiveEntitlements } from "../../../../utils/entitlements-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      throw appError("NOT_FOUND", "Thiếu mã định danh giáo án.");
    }

    const eventBody =
      (event.context as { body?: Record<string, unknown> })?.body ||
      (event as { _body?: Record<string, unknown> })._body;
    const body = eventBody || (await readBody(event)) || {};
    const parsed = RefreshLessonPlanItemSchema.safeParse(body);
    if (!parsed.success) {
      throw appError("VALIDATION_FAILED", {
        fields: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    const userId = Number(user.user_id);
    const entitlements = await resolveUserActiveEntitlements(userId);
    const updated = await refreshLessonPlanItem(
      userId,
      uuid,
      parsed.data.position,
      {
        userEntitlements: entitlements,
      }
    );

    return updated;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
