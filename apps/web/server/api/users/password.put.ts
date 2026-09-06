import { hashPassword, validatePasswordStrength } from "@mindkid/auth";
import { getOwnerDb, users } from "@mindkid/db";
import { PasswordAlreadySetError } from "@mindkid/errors/auth";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { eq } from "drizzle-orm";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { z } from "zod";

import {
  assertRequestBodySize,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

const SetPasswordSchema = z
  .object({
    new_password: z.string().min(8).max(1024),
  })
  .strict();

export default defineEventHandler(async (event) => {
  assertRequestBodySize(event, 8 * 1024);
  const userSession = await requireWebUserSession(event);
  await requireReauth(event);

  const userId = Number(userSession.user_id);

  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

  const parsed = SetPasswordSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError("Mật khẩu mới phải có ít nhất 8 ký tự.");
  }

  const passwordValidation = validatePasswordStrength(parsed.data.new_password);
  if (!passwordValidation.valid) {
    throw new ValidationError(
      passwordValidation.reason || "Mật khẩu không đủ mạnh."
    );
  }

  const db = getOwnerDb();
  const [account] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!account) {
    throw new NotFoundError("NOT_FOUND");
  }

  // If account already has a password, reject with 409 PASSWORD_ALREADY_SET
  if (account.passwordHash) {
    throw new PasswordAlreadySetError();
  }

  const newHash = await hashPassword(parsed.data.new_password);

  // BR-ACS-10: Initial password setup does NOT increment session_version
  await db
    .update(users)
    .set({
      passwordHash: newHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  setResponseStatus(event, 201);
  return {
    ok: true,
    message: "Thiết lập mật khẩu thành công.",
  };
});
