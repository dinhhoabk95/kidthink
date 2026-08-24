import { AppError } from "@mindkid/auth";
import { completePlaySession } from "@mindkid/db";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";

import {
  assertRequestBodySize,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const CompleteSchema = z
  .object({ last_seq: z.number().int().positive().optional() })
  .strict();

export default defineEventHandler(async (event) => {
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
});
