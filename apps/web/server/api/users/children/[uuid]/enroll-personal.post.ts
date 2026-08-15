import { appError } from "@kidthink/auth";
import { enrollChildInPersonalCurriculum } from "@kidthink/db";
import { enrollPersonalCurriculumSchema } from "@kidthink/shared";
import {
  defineEventHandler,
  getRequestHeader,
  getRequestIP,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const userId = Number(user.user_id);
    const childUuid = getRouterParam(event, "uuid") || "";

    const eventBody =
      (event.context as { body?: Record<string, unknown> })?.body ||
      (event as { _body?: Record<string, unknown> })._body;
    const body = eventBody || (await readBody(event)) || {};
    const parsed = enrollPersonalCurriculumSchema.safeParse(body);
    if (!parsed.success) {
      throw appError("VALIDATION_FAILED", {
        fields: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    const result = await enrollChildInPersonalCurriculum(
      {
        userId,
        ip: getRequestIP(event),
        userAgent: getRequestHeader(event, "user-agent"),
      },
      childUuid,
      parsed.data.personal_curriculum_uuid
    );

    setResponseStatus(event, 201);
    return result;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
