import { ValidationError } from "@mindkid/errors/common";
import { SessionNotFoundError } from "@mindkid/errors/play";
import { completePlaySession } from "@mindkid/play";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";

import {
  assertRequestBodySize,
  assertSameOriginRequest,
  getOrSetGuestDeviceId,
} from "#server/utils/auth-runtime";

const CompleteSchema = z
  .object({ last_seq: z.number().int().positive().optional() })
  .strict();

export default defineEventHandler(async (event) => {
  assertSameOriginRequest(event);
  assertRequestBodySize(event, 16 * 1024);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new SessionNotFoundError();
  }

  const guestDeviceId = getOrSetGuestDeviceId(event);
  const parsed = CompleteSchema.safeParse((await readBody(event)) || {});
  if (!parsed.success) {
    throw new ValidationError();
  }
  const lastSeq = parsed.data.last_seq;

  const result = await completePlaySession(uuid, lastSeq, {
    isUserCall: false,
    guestDeviceId,
  });

  return result;
});
