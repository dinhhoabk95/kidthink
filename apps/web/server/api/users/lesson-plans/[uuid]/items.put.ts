import { appError } from "@mindkid/auth";
import { ReplaceLessonPlanItemsSchema } from "@mindkid/shared";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { replaceLessonPlanItems } from "#server/services/index.js";
import { throwValidationError } from "#server/utils/api-error";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

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
