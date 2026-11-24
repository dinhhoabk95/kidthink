import { UserNotFoundError } from "@mindkid/errors/account";
import { manualGrantCreditsSchema } from "@mindkid/shared";
import {
  defineEventHandler,
  getHeader,
  getRouterParam,
  setResponseStatus,
} from "h3";
import { manualGrantCredits } from "#server/services/index.js";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { readRequestBody } from "#server/utils/request-body";

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  const userUuid = getRouterParam(event, "uuid");
  if (!userUuid) {
    throw new UserNotFoundError();
  }

  const rawBody = await readRequestBody(event);

  const parsed = manualGrantCreditsSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const result = await manualGrantCredits({
    managerId: session.manager_id,
    userUuid,
    input: parsed.data,
    ip: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") || null,
  });

  setResponseStatus(event, 201);
  return result;
});
