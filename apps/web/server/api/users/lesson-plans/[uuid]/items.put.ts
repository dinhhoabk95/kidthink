import { appError } from "@mindkid/auth";
import { replaceLessonPlanItems } from "@mindkid/db";
import { ReplaceLessonPlanItemsSchema } from "@mindkid/shared";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { throwValidationError } from "../../../../utils/api-error.js";
import { requireWebUserSession } from "../../../../utils/auth-runtime.js";
import { resolveUserActiveEntitlements } from "../../../../utils/entitlements-runtime.js";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw appError("NOT_FOUND", "Thiếu mã định danh giáo án.");
  }

  const eventBody =
    (event.context as { body?: Record<string, unknown> })?.body ||
    (event as { _body?: Record<string, unknown> })._body;
  const body = eventBody || (await readBody(event)) || {};
  const parsed = ReplaceLessonPlanItemsSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const userId = Number(user.user_id);
  const entitlements = await resolveUserActiveEntitlements(userId);
  const updated = await replaceLessonPlanItems(userId, uuid, parsed.data, {
    userEntitlements: entitlements,
  });

  return updated;
});
