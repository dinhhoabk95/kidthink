import { AppError, generateParentGateChallenge } from "@kidthink/auth";
import { createError, defineEventHandler, setResponseStatus } from "h3";
import {
  getParentGateSecret,
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    await requireWebUserSession(event);

    const challenge = generateParentGateChallenge(getParentGateSecret(event));
    return {
      challenge_id: challenge.challengeId,
      factor_a: challenge.factorA,
      factor_b: challenge.factorB,
      challenge_payload: challenge.challengePayload,
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
