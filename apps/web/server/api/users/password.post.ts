import {
  appError,
  hashPassword,
  validatePasswordStrength,
} from "@mindkid/auth";
import { activeSessions, getOwnerDb, users } from "@mindkid/db";
import { enqueueJob } from "@mindkid/queue";
import { and, eq, ne } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";

import {
  assertRequestBodySize,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

const ChangePasswordSchema = z
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

  const parsed = ChangePasswordSchema.safeParse(rawBody);
  if (!parsed.success) {
    setResponseStatus(event, 422);
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      data: {
        code: "VALIDATION_FAILED",
        message: "Mật khẩu mới phải có ít nhất 8 ký tự.",
      },
    });
  }

  const passwordValidation = validatePasswordStrength(parsed.data.new_password);
  if (!passwordValidation.valid) {
    setResponseStatus(event, 422);
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      data: {
        code: "VALIDATION_FAILED",
        message: passwordValidation.reason || "Mật khẩu không đủ mạnh.",
      },
    });
  }

  const db = getOwnerDb();
  const [account] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      sessionVersion: users.sessionVersion,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!account) {
    setResponseStatus(event, 404);
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  // BR-ACS-09: Calling change password on account without password returns 409 PASSWORD_NOT_SET
  if (!account.passwordHash) {
    throw appError("PASSWORD_NOT_SET");
  }

  const newHash = await hashPassword(parsed.data.new_password);
  const now = new Date();

  // BR-ACS-02: Increment session_version and revoke all other sessions
  await db
    .update(users)
    .set({
      passwordHash: newHash,
      sessionVersion: account.sessionVersion + 1,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  const currentSessionId =
    userSession.session_id ||
    (event.context?.user as { session_id?: string })?.session_id ||
    `sess_${userId}`;

  await db
    .update(activeSessions)
    .set({ revokedAt: now })
    .where(
      and(
        eq(activeSessions.accountType, "user"),
        eq(activeSessions.accountId, userId),
        ne(activeSessions.deviceId, currentSessionId)
      )
    )
    .catch(() => null);

  // Send notification to current email (BR-ACS-02, BR-NOT-01)
  await enqueueJob("email:send", {
    to: account.email,
    template: "password_changed_notification",
    data: {
      timestamp: now.toISOString(),
    },
  }).catch(() => null);

  return {
    ok: true,
    message:
      "Đổi mật khẩu thành công. Các phiên đăng nhập trên thiết bị khác đã được đăng xuất.",
  };
});
