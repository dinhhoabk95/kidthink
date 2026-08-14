import { AppError, verifyParentGateChallenge } from "@kidthink/auth";
import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import {
  assertRequestBodySize,
  getParentGateSecret,
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";

const ParentGateVerifySchema = z
  .object({
    challenge_payload: z.string().min(1).max(2048),
    answer: z.number().int(),
  })
  .strict();

export default defineEventHandler(async (event) => {
  try {
    assertRequestBodySize(event, 16 * 1024);
    const user = await requireWebUserSession(event);
    const eventBody = (event.context as { body?: Record<string, unknown> })
      ?.body;
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
