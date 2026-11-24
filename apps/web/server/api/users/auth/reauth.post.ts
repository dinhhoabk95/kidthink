import { InvalidCredentialsError } from "@mindkid/errors/auth";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { verifyUserReauthCredentials } from "#server/services/identity-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { markCurrentSessionReauthenticated } from "#server/utils/reauth-runtime";

const ReauthSchema = z
  .object({
    password: z.string().min(1).max(1024).optional(),
    totp: z.string().length(6).optional(),
    code: z.string().length(6).optional(),
    method: z.enum(["password", "totp"]).optional(),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const userSession = requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  const eventBody = (event.context as { body?: Record<string, string> })?.body;
  const rawBody =
    eventBody || (await readBody<Record<string, string>>(event)) || {};

  const parsed = ReauthSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new InvalidCredentialsError();
  }

  await verifyUserReauthCredentials({
    userId,
    password: parsed.data.password,
    totp: parsed.data.totp ?? parsed.data.code,
    method: parsed.data.method,
  });

  const now = new Date();
  await markCurrentSessionReauthenticated(event, now);

  return {
    ok: true,
    reauthenticated_at: now.toISOString(),
  };
});
