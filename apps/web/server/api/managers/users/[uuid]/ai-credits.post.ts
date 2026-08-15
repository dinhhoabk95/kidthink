import { appError } from "@kidthink/auth";
import { manualGrantCredits } from "@kidthink/db";
import { manualGrantCreditsSchema } from "@kidthink/shared";
import {
  defineEventHandler,
  getHeader,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import {
  getManagerRemoteIp,
  requireSuperAdminSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.ts";

export default defineEventHandler(async (event) => {
  try {
    const session = requireSuperAdminSession(event);
    const userUuid = getRouterParam(event, "uuid");
    if (!userUuid) {
      throw appError("NOT_FOUND", "User UUID is required");
    }

    const customEvent = event as unknown as {
      _body?: unknown;
      context?: { body?: unknown };
    };
    const rawBody =
      (await readBody(event).catch(() => undefined)) ??
      customEvent._body ??
      customEvent.context?.body;

    const parsed = manualGrantCreditsSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw appError("VALIDATION_FAILED", {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await manualGrantCredits({
      managerId: session.manager_id,
      userUuid,
      input: parsed.data,
      ip: getManagerRemoteIp(event),
      userAgent: getHeader(event, "user-agent") || null,
    });

    setResponseStatus(event, 201);
    return result;
  } catch (error) {
    respondToManagerAuthError(event, error);
  }
});
