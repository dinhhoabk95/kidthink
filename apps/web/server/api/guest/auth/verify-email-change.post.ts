import { hashSecureToken } from "@mindkid/auth";
import { getOwnerDb, users, userVerifications } from "@mindkid/db";
import { EmailAlreadyInUseError } from "@mindkid/errors/account";
import { TokenExpiredError } from "@mindkid/errors/auth";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import { and, eq, gt, sql } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { throwValidationError } from "#server/utils/api-error";
import { revokeAllBetterAuthSessions } from "#server/utils/better-auth";

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

  const newEmail = parsed.data.new_email.trim().toLowerCase();
  const tokenHash = hashSecureToken(
    `email_change:${parsed.data.token}:${newEmail}`
  );
  const identifier = `email_change:${tokenHash}`;
  const now = new Date();

  const db = getOwnerDb();

  const [tokenRecord] = await db
    .select()
    .from(userVerifications)
    .where(
      and(
        eq(userVerifications.identifier, identifier),
        gt(userVerifications.expiresAt, now)
      )
    )
    .limit(1);

  if (!tokenRecord) {
    throw new TokenExpiredError();
  }

  const parsedValue = JSON.parse(tokenRecord.value) as {
    userId: number;
    newEmail: string;
  };
  const userId = Number(parsedValue.userId);

  const [currentUser] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!currentUser) {
    throw new TokenExpiredError();
  }

  const oldEmail = currentUser.email;

  const [conflict] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, newEmail))
    .limit(1);

  if (conflict && conflict.id !== userId) {
    throw new EmailAlreadyInUseError();
  }

  await db.transaction(async (tx) => {
    const deleted = await tx
      .delete(userVerifications)
      .where(eq(userVerifications.id, tokenRecord.id))
      .returning({ id: userVerifications.id });

    if (deleted.length === 0) {
      throw new TokenExpiredError();
    }

    await tx
      .update(users)
      .set({
        email: newEmail,
        emailVerified: true,
        emailVerifiedAt: now,
        sessionVersion: sql`${users.sessionVersion} + 1`,
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  });

  await revokeAllBetterAuthSessions("user", userId).catch(() => null);

  await dispatchTransactionalEmail({
    recipientType: "user",
    recipientId: userId,
    code: "email_changed_old_address_notice",
    to: oldEmail,
    payload: {
      new_email: newEmail,
      timestamp: now.toISOString(),
    },
  });

  return {
    ok: true,
    email: newEmail,
    message: "Cập nhật địa chỉ email thành công.",
  };
});
