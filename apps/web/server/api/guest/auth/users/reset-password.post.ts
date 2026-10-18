import {
  hashPassword,
  hashSecureToken,
  validatePasswordStrength,
} from "@mindkid/auth";
import {
  activeSessions,
  getAppDb,
  users,
  verificationTokens,
} from "@mindkid/db";
import { TokenExpiredError } from "@mindkid/errors/auth";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, type H3Event, readBody } from "h3";
import { z } from "zod";
import { revokeAllUserSessions } from "#server/utils/session-revocation";

const ResetPasswordSchema = z
  .object({
    token: z.string().trim().min(1).max(512),
    new_password: z.string().min(8).max(1024).optional(),
    password: z.string().min(8).max(1024).optional(),
  })
  .strict()
  .refine((data) => Boolean(data.new_password ?? data.password), {
    message: "Mật khẩu mới là bắt buộc.",
  });

export async function handleResetPassword(event: H3Event, testBody?: unknown) {
  const rawBody =
    testBody ??
    event.context?.body ??
    (await readBody(event).catch(() => null));
  const parsed = ResetPasswordSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError();
  }
  const token = parsed.data.token;
  const newPassword = parsed.data.new_password ?? parsed.data.password ?? "";

  const passVal = validatePasswordStrength(newPassword);
  if (!passVal.valid) {
    throw new ValidationError({
      reason: passVal.reason || "Mật khẩu mới không đạt yêu cầu an toàn.",
    });
  }

  const db = getAppDb();
  const tokenHash = hashSecureToken(token);

  const tokenRows = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.tokenHash, tokenHash),
        eq(verificationTokens.accountType, "user"),
        eq(verificationTokens.purpose, "password_reset")
      )
    );

  if (tokenRows.length === 0) {
    throw new NotFoundError();
  }

  const vToken = tokenRows[0];
  if (!vToken) {
    throw new NotFoundError();
  }

  if (vToken.usedAt !== null || vToken.expiresAt <= new Date()) {
    throw new TokenExpiredError();
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, vToken.accountId));

  if (!user) {
    throw new NotFoundError();
  }

  const newPassHash = await hashPassword(newPassword);
  const now = new Date();

  await db.transaction(async (tx) => {
    // Claim the token atomically before changing any account state.
    const [claimed] = await tx
      .update(verificationTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(verificationTokens.id, vToken.id),
          eq(verificationTokens.accountType, "user"),
          eq(verificationTokens.purpose, "password_reset"),
          isNull(verificationTokens.usedAt)
        )
      )
      .returning({ id: verificationTokens.id });
    if (!claimed) {
      throw new TokenExpiredError();
    }

    await tx
      .update(users)
      .set({
        passwordHash: newPassHash,
        sessionVersion: user.sessionVersion + 1,
        updatedAt: now,
      })
      .where(eq(users.id, user.id));

    await tx
      .delete(activeSessions)
      .where(
        and(
          eq(activeSessions.accountType, "user"),
          eq(activeSessions.accountId, user.id)
        )
      );
  });

  // UC-005 BR-003: sau khi giao dịch thành công, đá mọi phiên và remember token ở Redis.
  await revokeAllUserSessions(user.id);

  // BR-PWR-04: Gửi email thông báo sau khi đổi thành công
  await dispatchTransactionalEmail({
    recipientType: "user",
    recipientId: user.id,
    code: "password_changed",
    to: user.email,
    payload: {
      email: user.email,
      displayName: user.displayName,
      timestamp: now.toISOString(),
    },
  });

  return { ok: true };
}

export default defineEventHandler((event) => handleResetPassword(event));
