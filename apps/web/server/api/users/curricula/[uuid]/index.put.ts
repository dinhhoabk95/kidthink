import { appError } from "@kidthink/auth";
import { updatePersonalCurriculumMeta } from "@kidthink/db";
import { updatePersonalCurriculumMetaSchema } from "@kidthink/shared";
import {
  defineEventHandler,
  getRequestHeader,
  getRequestIP,
  getRouterParam,
  readBody,
} from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const userId = Number(user.user_id);
    const uuid = getRouterParam(event, "uuid") || "";

    const eventBody =
      (event.context as { body?: Record<string, unknown> })?.body ||
      (event as { _body?: Record<string, unknown> })._body;
    const body = eventBody || (await readBody(event)) || {};
    const parsed = updatePersonalCurriculumMetaSchema.safeParse(body);
    if (!parsed.success) {
      throw appError("VALIDATION_FAILED", {
        fields: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    const curriculum = await updatePersonalCurriculumMeta(
      {
        userId,
        ip: getRequestIP(event),
        userAgent: getRequestHeader(event, "user-agent"),
      },
      uuid,
      parsed.data
    );

    return curriculum;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
