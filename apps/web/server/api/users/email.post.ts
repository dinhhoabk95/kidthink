import { ValidationError } from "@mindkid/errors/common";
import { enforceTwoAxisRateLimit } from "@mindkid/shared";
import { defineEventHandler } from "h3";
import { z } from "zod";
import { requestUserEmailChange } from "#server/services/identity-service";
import {
  assertRateLimitAllowed,
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";
import { readBodyWithLimit } from "#server/utils/request-body";

const ChangeEmailSchema = z
  .object({
    new_email: z.string().trim().email().max(255),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const userSession = requireWebUserSession(event);
  requireReauth(event);

  const userId = Number(userSession.user_id);
  const rateLimitRes = await enforceTwoAxisRateLimit({
    routeClass: "auth:forgot-password",
    remoteIp: getVerifiedRemoteIp(event),
    accountIdentifier: String(userId),
  });
  assertRateLimitAllowed(rateLimitRes.statusCode);

  const rawBody = await readBodyWithLimit(event);
  const parsed = ChangeEmailSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError("Địa chỉ email không hợp lệ.");
  }

  return await requestUserEmailChange({
    userId,
    newEmail: parsed.data.new_email,
  });
});
