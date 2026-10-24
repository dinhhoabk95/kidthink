import { getBrowserSessionService, hashSecureToken } from "@mindkid/auth";
import { getOwnerDb, users, verificationTokens } from "@mindkid/db";
import { EmailAlreadyInUseError } from "@mindkid/errors/account";
import { TokenExpiredError } from "@mindkid/errors/auth";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { throwValidationError } from "#server/utils/api-error";

const VerifyEmailChangeSchema = z
  .object({
    token: z.string().min(1).max(512),
    new_email: z.string().trim().email().max(255),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

  const parsed = VerifyEmailChangeSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const newEmail = parsed.data.new_email.trim().toLowerCase();
  const tokenHash = hashSecureToken(
    `email_change:${parsed.data.token}:${newEmail}`
  );
  const now = new Date();

  const db = getOwnerDb();

  // Find token
  const [tokenRecord] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.tokenHash, tokenHash),
        eq(verificationTokens.purpose, "email_verify"),
        eq(verificationTokens.accountType, "user"),
        isNull(verificationTokens.usedAt),
        gt(verificationTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (!tokenRecord) {
    throw new TokenExpiredError();
  }

  const userId = tokenRecord.accountId;

  const [currentUser] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!currentUser) {
    throw new TokenExpiredError();
  }

  const oldEmail = currentUser.email;

  // Check if new_email was registered by someone else in the meantime
  const [conflict] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, newEmail))
    .limit(1);

  if (conflict && conflict.id !== userId) {
    throw new EmailAlreadyInUseError();
  }

  // Update user email and mark token used atomically
  await db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(verificationTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(verificationTokens.id, tokenRecord.id),
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
        email: newEmail,
        emailVerifiedAt: now,
        sessionVersion: sql`${users.sessionVersion} + 1`,
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  });

  await getBrowserSessionService()
    .revokeAll({
      account_type: "user",
      account_id: userId,
    })
    .catch(() => null);

  // BR-ACS-05: Send notice to the OLD email address
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
