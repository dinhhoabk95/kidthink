import { appError } from "@kidthink/auth";
import { requestExportJob } from "@kidthink/db";
import { RequestExportSchema } from "@kidthink/shared";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
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
    const parsed = RequestExportSchema.safeParse(body);
    if (!parsed.success) {
      throw appError("VALIDATION_FAILED", {
        fields: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
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
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
