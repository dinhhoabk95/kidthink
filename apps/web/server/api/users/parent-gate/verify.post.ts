import { verifyParentGateChallenge } from "@mindkid/auth";
import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";

import {
  getParentGateSecret,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const ParentGateVerifySchema = z
  .object({
    challenge_payload: z.string().min(1).max(2048),
    answer: z.number().int(),
  })
  .strict();

type ParentGateRawBody = Record<
  string,
  string | number | boolean | null | undefined
>;

export default defineEventHandler(async (event) => {
  const user = requireWebUserSession(event);
  const eventBody = (event.context as { body?: ParentGateRawBody })?.body;
  const body = eventBody || (await readBody<ParentGateRawBody>(event)) || {};

  const parsed = ParentGateVerifySchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError();
  }
  const { challenge_payload: challengePayload, answer } = parsed.data;

  const userId = Number(user.user_id);
  const result = await verifyParentGateChallenge(
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
