import { appError } from "@mindkid/auth";
import { manualGrantCredits } from "@mindkid/db";
import { manualGrantCreditsSchema } from "@mindkid/shared";
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
} from "../../../../utils/admin-auth-runtime.ts";
import { throwValidationError } from "../../../../utils/api-error.js";

export default defineEventHandler(async (event) => {
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
    throwValidationError(parsed.error);
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
});
