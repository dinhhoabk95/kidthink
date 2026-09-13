import { NotFoundError, ValidationError } from "@mindkid/errors/common";

import { completePlaySession } from "@mindkid/play";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";

import {
  getOrSetGuestDeviceId,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const CompleteSchema = z
  .object({
    last_seq: z.number().int().positive().optional(),
    rounds_completed: z.number().int().nonnegative().optional(),
    rounds_total: z.number().int().nonnegative().optional(),
    rounds_skipped: z.number().int().nonnegative().optional(),
    hint_count: z.number().int().nonnegative().optional(),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  const guestDeviceId = getOrSetGuestDeviceId(event);
  const parsed = CompleteSchema.safeParse((await readBody(event)) || {});
  if (!parsed.success) {
    throw new ValidationError();
  }
  const lastSeq = parsed.data.last_seq;

  const result = await completePlaySession(uuid, lastSeq, {
    isUserCall: true,
    callerAccountId: user.user_id,
    guestDeviceId,
  });

  return result;
});
