import { hashSecureToken } from "@mindkid/auth";
import { getOwnerDb, users, verificationTokens } from "@mindkid/db";
import { EmailAlreadyInUseError } from "@mindkid/errors/account";
import { TokenExpiredError } from "@mindkid/errors/auth";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import { and, eq, gt, isNull } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { throwValidationError } from "#server/utils/api-error";
import {
  assertRequestBodySize,
  assertSameOriginRequest,
} from "#server/utils/auth-runtime";

const VerifyEmailChangeSchema = z
  .object({
    token: z.string().min(1).max(512),
    new_email: z.string().trim().email().max(255),
  })
  .strict();

export default defineEventHandler(async (event) => {
  assertSameOriginRequest(event);
  assertRequestBodySize(event, 8 * 1024);

  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

  const parsed = VerifyEmailChangeSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const tokenHash = hashSecureToken(parsed.data.token);
  const newEmail = parsed.data.new_email.toLowerCase();
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

  // Update user email and mark token used
  await db
    .update(users)
    .set({
      email: newEmail,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  await db
    .update(verificationTokens)
    .set({ usedAt: now })
    .where(eq(verificationTokens.id, tokenRecord.id));

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
