import { AppError, verifyParentGateChallenge } from "@mindkid/auth";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";

import {
  assertRequestBodySize,
  getParentGateSecret,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const ParentGateVerifySchema = z
  .object({
    challenge_payload: z.string().min(1).max(2048),
    answer: z.number().int(),
  })
  .strict();

export default defineEventHandler(async (event) => {
  assertRequestBodySize(event, 16 * 1024);
  const user = await requireWebUserSession(event);
  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const body =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

  const parsed = ParentGateVerifySchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError("VALIDATION_FAILED");
  }
  const { challenge_payload: challengePayload, answer } = parsed.data;

  const userId = Number(user.user_id);
  const result = verifyParentGateChallenge(
    challengePayload,
    answer,
    userId,
    getParentGateSecret(event)
  );

  return {
    gate_token: result.gateToken,
    expires_at: result.expiresAt,
  };
});
