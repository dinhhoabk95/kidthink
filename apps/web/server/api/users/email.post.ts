import { appError, generateSecureToken, hashSecureToken } from "@mindkid/auth";
import {
  dispatchTransactionalEmail,
  getOwnerDb,
  users,
  verificationTokens,
} from "@mindkid/db";
import { and, eq, isNull } from "drizzle-orm";
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

const ChangeEmailSchema = z
  .object({
    new_email: z.string().trim().email().max(255),
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

  const parsed = ChangeEmailSchema.safeParse(rawBody);
  if (!parsed.success) {
    setResponseStatus(event, 422);
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      data: {
        code: "VALIDATION_FAILED",
        message: "Địa chỉ email không hợp lệ.",
      },
    });
  }

  const newEmail = parsed.data.new_email.toLowerCase();
  const db = getOwnerDb();

  const [currentUser] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!currentUser) {
    setResponseStatus(event, 404);
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  if (currentUser.email.toLowerCase() === newEmail) {
    setResponseStatus(event, 400);
    throw createError({
      statusCode: 400,
      statusMessage: "SAME_EMAIL",
      data: {
        code: "SAME_EMAIL",
        message: "Địa chỉ email mới trùng với địa chỉ hiện tại.",
      },
    });
  }

  // Check if new_email is already used by another user
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, newEmail))
    .limit(1);

  if (existing) {
    throw appError("EMAIL_ALREADY_IN_USE");
  }

  // Generate token valid for 24h (BR-ACS-03, BR-ACS-04)
  const rawToken = generateSecureToken();
  const tokenHash = hashSecureToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Invalidate previous pending verification tokens for this user
  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.accountType, "user"),
        eq(verificationTokens.accountId, userId),
        eq(verificationTokens.purpose, "email_verify"),
        isNull(verificationTokens.usedAt)
      )
    )
    .catch(() => null);

  await db.insert(verificationTokens).values({
    accountType: "user",
    accountId: userId,
    purpose: "email_verify",
    tokenHash,
    expiresAt,
  });

  // Enqueue verification email to the NEW email address (BR-ACS-03)
  await dispatchTransactionalEmail({
    recipientType: "user",
    recipientId: userId,
    code: "email_change_verification",
    to: newEmail,
    payload: {
      token: rawToken,
      new_email: newEmail,
      expires_at: expiresAt.toISOString(),
    },
  });

  return {
    pending_email: newEmail,
    expires_at: expiresAt.toISOString(),
    message:
      "Đã gửi mã xác nhận đến địa chỉ email mới. Vui lòng kiểm tra hộp thư trong vòng 24 giờ.",
  };
});
