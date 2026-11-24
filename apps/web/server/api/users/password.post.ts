import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { changeUserPassword } from "#server/services/identity-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";
import { revokeOtherUserSessions } from "#server/utils/session-revocation";

const ChangePasswordSchema = z
  .object({
    new_password: z.string().min(8).max(1024),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const userSession = requireWebUserSession(event);
  requireReauth(event);

  const userId = Number(userSession.user_id);

  const eventBody = (event.context as { body?: Record<string, string> })?.body;
  const rawBody =
    eventBody || (await readBody<Record<string, string>>(event)) || {};

  const parsed = ChangePasswordSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError("Mật khẩu mới phải có ít nhất 8 ký tự.");
  }

  const result = await changeUserPassword(userId, parsed.data.new_password);
  await revokeOtherUserSessions(event);
  return result;
});
