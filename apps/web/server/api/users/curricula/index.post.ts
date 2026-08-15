import { appError } from "@kidthink/auth";
import { createPersonalCurriculum } from "@kidthink/db";
import { createPersonalCurriculumSchema } from "@kidthink/shared";
import {
  defineEventHandler,
  getRequestHeader,
  getRequestIP,
  readBody,
  setResponseStatus,
} from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";
import { resolveUserActiveEntitlements } from "../../../utils/entitlements-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const userId = Number(user.user_id);

    const eventBody =
      (event.context as { body?: Record<string, unknown> })?.body ||
      (event as { _body?: Record<string, unknown> })._body;
    const body = eventBody || (await readBody(event)) || {};
    const parsed = createPersonalCurriculumSchema.safeParse(body);
    if (!parsed.success) {
      throw appError("VALIDATION_FAILED", {
        fields: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    const entitlements = await resolveUserActiveEntitlements(userId);
    const curriculum = await createPersonalCurriculum(
      {
        userId,
        entitlements,
        ip: getRequestIP(event),
        userAgent: getRequestHeader(event, "user-agent"),
      },
      parsed.data
    );

    setResponseStatus(event, 201);
    return curriculum;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
