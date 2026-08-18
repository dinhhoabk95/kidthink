import { completeChildPersonalCurriculumItem } from "@mindkid/db";
import {
  defineEventHandler,
  getRequestHeader,
  getRequestIP,
  getRouterParam,
  readBody,
} from "h3";
import { z } from "zod";
import { throwValidationError } from "../../../../../utils/api-error.js";
import { requireWebUserSession } from "../../../../../utils/auth-runtime.js";

const completeItemSchema = z.object({
  personal_curriculum_item_id: z.number().int().positive(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const childUuid = getRouterParam(event, "uuid") || "";

  const eventBody =
    (event.context as { body?: Record<string, unknown> })?.body ||
    (event as { _body?: Record<string, unknown> })._body;
  const body = eventBody || (await readBody(event)) || {};
  const parsed = completeItemSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const result = await completeChildPersonalCurriculumItem(
    {
      userId,
      ip: getRequestIP(event),
      userAgent: getRequestHeader(event, "user-agent"),
    },
    childUuid,
    parsed.data.personal_curriculum_item_id
  );

  return result;
});
