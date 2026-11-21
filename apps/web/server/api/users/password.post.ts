import { hashPassword, validatePasswordStrength } from "@mindkid/auth";
import { getOwnerDb, userAccounts, users } from "@mindkid/db";
import { PasswordNotSetError } from "@mindkid/errors/auth";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
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
      email: users.email,
      passwordHash: users.passwordHash,
      sessionVersion: users.sessionVersion,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!account) {
    throw new NotFoundError("NOT_FOUND");
  }

  const [cred] = await db
    .select({ id: userAccounts.id, password: userAccounts.password })
    .from(userAccounts)
    .where(
      and(
        eq(userAccounts.userId, userId),
        eq(userAccounts.providerId, "credential")
      )
    )
    .limit(1);

  if (!(cred?.password || account.passwordHash)) {
    throw new PasswordNotSetError();
  }

  const newHash = await hashPassword(parsed.data.new_password);
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash: newHash,
        sessionVersion: account.sessionVersion + 1,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    if (cred) {
      await tx
        .update(userAccounts)
        .set({ password: newHash, updatedAt: now })
        .where(eq(userAccounts.id, cred.id));
    } else {
      await tx.insert(userAccounts).values({
        userId,
        accountId: String(userId),
        providerId: "credential",
        password: newHash,
      });
    }
  });

  await revokeOtherUserSessions(event);

  await dispatchTransactionalEmail({
    recipientType: "user",
    recipientId: userId,
    code: "password_changed_notification",
    to: account.email,
    payload: { timestamp: now.toISOString() },
  });

  return {
    ok: true,
    message:
      "Đổi mật khẩu thành công. Các phiên đăng nhập trên thiết bị khác đã được đăng xuất.",
  };
});
