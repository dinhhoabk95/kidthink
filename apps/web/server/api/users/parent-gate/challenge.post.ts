import { generateParentGateChallenge } from "@mindkid/auth";
import { defineEventHandler } from "h3";

import {
  getParentGateSecret,
  requireWebUserSession,
} from "../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  await requireWebUserSession(event);

  const challenge = generateParentGateChallenge(getParentGateSecret(event));
  return {
    challenge_id: challenge.challengeId,
    factor_a: challenge.factorA,
    factor_b: challenge.factorB,
    challenge_payload: challenge.challengePayload,
  };
});
