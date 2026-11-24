import { InvalidCredentialsError } from "@mindkid/errors/auth";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { verifyManagerReauthCredentials } from "#server/services/identity-manager-service";
import { requireManagerSessionForEnrollment } from "#server/utils/admin-auth-runtime";
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
  const managerSession = requireManagerSessionForEnrollment(event);
  const managerId = Number(managerSession.manager_id);

  const eventBody = (event.context as { body?: Record<string, string> })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as Record<string, string>) || {};

  const parsed = ReauthSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new InvalidCredentialsError();
  }

  await verifyManagerReauthCredentials({
    managerId,
    password: parsed.data.password,
    totp: parsed.data.totp ?? parsed.data.code,
  });

  const now = new Date();
  await markCurrentSessionReauthenticated(event, now);

  return {
    ok: true,
    reauthenticated_at: now.toISOString(),
  };
});
