import { requestExportJob } from "@mindkid/db";
import { RequestExportSchema } from "@mindkid/shared";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { throwValidationError } from "#server/utils/api-error";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);

  const eventBody =
    (event.context as { body?: Record<string, unknown> })?.body ||
    (event as { _body?: Record<string, unknown> })._body;
  const body = eventBody || (await readBody(event)) || {};
  const parsed = RequestExportSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const entitlements = await resolveUserActiveEntitlements(userId);
  const result = await requestExportJob(
    userId,
    parsed.data.kind,
    parsed.data.ref_id,
    {
      userEntitlements: entitlements,
    }
  );

  setResponseStatus(event, 202);
  return result;
});
