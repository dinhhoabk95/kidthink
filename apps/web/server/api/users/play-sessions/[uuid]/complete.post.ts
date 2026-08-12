import { AppError } from "@kidthink/auth";
import { completePlaySession } from "@kidthink/db";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import {
  assertRequestBodySize,
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";

const CompleteSchema = z
  .object({ last_seq: z.number().int().positive().optional() })
  .strict();

export default defineEventHandler(async (event) => {
  try {
    assertRequestBodySize(event, 16 * 1024);
    const user = await requireWebUserSession(event);
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    const parsed = CompleteSchema.safeParse((await readBody(event)) || {});
    if (!parsed.success) {
      throw new AppError("VALIDATION_FAILED");
    }
    const lastSeq = parsed.data.last_seq;

    const result = await completePlaySession(uuid, lastSeq, {
      isUserCall: true,
      callerAccountId: user.user_id,
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
