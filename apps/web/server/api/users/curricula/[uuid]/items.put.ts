import { replacePersonalCurriculumItems } from "@mindkid/db";
import { replacePersonalCurriculumItemsSchema } from "@mindkid/shared";
import {
  defineEventHandler,
  getRequestHeader,
  getRequestIP,
  getRouterParam,
  readBody,
} from "h3";
import { throwValidationError } from "../../../../utils/api-error.js";
import { requireWebUserSession } from "../../../../utils/auth-runtime.js";
import { resolveUserActiveEntitlements } from "../../../../utils/entitlements-runtime.js";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const uuid = getRouterParam(event, "uuid") || "";

  const eventBody =
    (event.context as { body?: Record<string, unknown> })?.body ||
    (event as { _body?: Record<string, unknown> })._body;
  const body = eventBody || (await readBody(event)) || {};
  const parsed = replacePersonalCurriculumItemsSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const entitlements = await resolveUserActiveEntitlements(userId);
  const curriculum = await replacePersonalCurriculumItems(
    {
      userId,
      entitlements,
      ip: getRequestIP(event),
      userAgent: getRequestHeader(event, "user-agent"),
    },
    uuid,
    parsed.data
  );

  return curriculum;
});
