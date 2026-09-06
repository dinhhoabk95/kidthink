import {
  hashPassword,
  hashSecureToken,
  validatePasswordStrength,
} from "@mindkid/auth";
import {
  activeSessions,
  getAppDb,
  notificationDeliveries,
  notifications,
  users,
  verificationTokens,
} from "@mindkid/db";
import { TokenExpiredError } from "@mindkid/errors/auth";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, type H3Event, readBody } from "h3";
import { z } from "zod";
import {
  assertRequestBodySize,
  assertSameOriginRequest,
} from "#server/utils/auth-runtime";

const ResetPasswordSchema = z
  .object({
    token: z.string().trim().min(1).max(512),
    new_password: z.string().min(8).max(1024),
  })
  .strict();

export async function handleResetPassword(event: H3Event, testBody?: unknown) {
  assertSameOriginRequest(event);
  assertRequestBodySize(event, 16 * 1024);
  const rawBody =
    testBody ??
    event.context?.body ??
    (await readBody(event).catch(() => null));
  const parsed = ResetPasswordSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError();
  }
  const { token, new_password: newPassword } = parsed.data;

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

    const [createdNotification] = await tx
      .insert(notifications)
      .values({
        recipientType: "user",
        recipientId: user.id,
        templateCode: "password_changed",
        payload: {
          email: user.email,
          displayName: user.displayName,
        },
      })
      .returning();

    if (createdNotification) {
      await tx.insert(notificationDeliveries).values({
        notificationId: createdNotification.id,
        channel: "email",
        status: "queued",
      });
    }
  });

  return { ok: true };
}

export default defineEventHandler((event) => handleResetPassword(event));
