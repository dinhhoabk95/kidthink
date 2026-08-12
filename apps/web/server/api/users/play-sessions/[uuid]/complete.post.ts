import { AppError } from "@kidthink/auth";
import { completePlaySession } from "@kidthink/db";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import {
  getActiveChildCandidate,
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const activeChildId = getActiveChildCandidate(event);
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    const body = (await readBody(event)) || {};
    const lastSeq = body.last_seq;

    const result = await completePlaySession(uuid, lastSeq, {
      isUserCall: true,
      callerChildProfileId: activeChildId ? Number(activeChildId) : null,
      accountChildIds: user.child_profiles
        ? user.child_profiles.map((cp: { id: number }) => Number(cp.id))
        : undefined,
    });

    return result;
  } catch (err) {
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: { code: err.code, message: err.message },
      });
    }
    return respondToUserAuthError(event, err);
  }
});
