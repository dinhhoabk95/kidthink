import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { verifyUserEmailChange } from "#server/services/identity-service";
import { throwValidationError } from "#server/utils/api-error";

const VerifyEmailChangeSchema = z
  .object({
    token: z.string().min(1).max(512),
    new_email: z.string().trim().email().max(255),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const eventBody = (event.context as { body?: Record<string, string> })?.body;
  const rawBody =
    eventBody || (await readBody<Record<string, string>>(event)) || {};

  const parsed = VerifyEmailChangeSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  return await verifyUserEmailChange({
    token: parsed.data.token,
    newEmail: parsed.data.new_email,
  });
});
