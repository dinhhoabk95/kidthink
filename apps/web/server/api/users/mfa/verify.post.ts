import {
  decryptTotpSecret,
  generateRecoveryCodes,
  getAuthRedisClient,
  hashRecoveryCode,
  MfaAttemptGuard,
  verifyTotpCode,
} from "@mindkid/auth";
import { getOwnerDb, mfaRecoveryCodes, mfaSettings, users } from "@mindkid/db";
import {
  MfaAlreadyEnabledError,
  MfaInvalidCodeError,
  MfaLockedError,
  MfaRequiredError,
  MfaSecretCorruptedError,
} from "@mindkid/errors/auth";
import { and, eq, sql } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";

import { getMfaEncryptionKey } from "#server/utils/admin-auth-runtime";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { revokeOtherUserSessions } from "#server/utils/session-revocation";

const verifyMfaSchema = z.object({
  code: z.string().length(6),
});

export default defineEventHandler(async (event) => {
  const session = await requireWebUserSession(event);
  const userId = session.user_id;

  const raw = event.context?.body ?? (await readBody(event).catch(() => ({})));

  const parsedResult = verifyMfaSchema.safeParse(raw);
  if (!parsedResult.success) {
    throw new MfaInvalidCodeError("Mã xác thực không đúng hoặc đã hết hạn");
  }

  const code = parsedResult.data.code.trim();
  const attemptGuard = new MfaAttemptGuard(getAuthRedisClient());
  await attemptGuard.assertNotLocked("user", userId);

  const db = getOwnerDb();
  const [setting] = await db
    .select()
    .from(mfaSettings)
    .where(
      and(
        eq(mfaSettings.accountType, "user"),
        eq(mfaSettings.accountId, userId)
      )
    );

  if (!setting) {
    throw new MfaRequiredError("Chưa khởi tạo thiết lập MFA");
  }

  // Đã bật rồi thì không sinh lại mã khôi phục bằng đường xác nhận (UC-052 BR-011).
  if (setting.confirmedAt) {
    throw new MfaAlreadyEnabledError();
  }

  let decryptedSecret: string;
  try {
    decryptedSecret = decryptTotpSecret(
      setting.secretEncrypted,
      getMfaEncryptionKey()
    );
  } catch {
    // BR-MFA-13: decryption failure is a system error, not a wrong code
    throw new MfaSecretCorruptedError();
  }
  const isValid = verifyTotpCode(code, decryptedSecret); // BR-MFA-04, BR-MFA-12

  if (!isValid) {
    const failure = await attemptGuard.recordFailure("user", userId);
    if (failure.locked) {
      throw new MfaLockedError();
    }
    throw new MfaInvalidCodeError("Mã xác thực không chính xác");
  }
  await attemptGuard.reset("user", userId);

  // BR-MFA-02: Generate 10 recovery codes, store hashes
  const rawRecoveryCodes = generateRecoveryCodes(10);
  const now = new Date();

  // Một giao dịch: xác nhận, thay bộ mã khôi phục, tăng sessionVersion.
  await db.transaction(async (tx) => {
    await tx
      .update(mfaSettings)
      .set({ confirmedAt: now })
      .where(eq(mfaSettings.id, setting.id));

    await tx
      .delete(mfaRecoveryCodes)
      .where(
        and(
          eq(mfaRecoveryCodes.accountType, "user"),
          eq(mfaRecoveryCodes.accountId, userId)
        )
      );

    await tx.insert(mfaRecoveryCodes).values(
      rawRecoveryCodes.map((rawCode) => ({
        accountType: "user" as const,
        accountId: userId,
        codeHash: hashRecoveryCode(rawCode),
      }))
    );

    await tx
      .update(users)
      .set({
        sessionVersion: sql`${users.sessionVersion} + 1`,
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  });

  // BR-MFA-06 (UC-052 BR-006): bật MFA thu hồi mọi phiên khác ở Redis, giữ phiên hiện tại.
  await revokeOtherUserSessions(event, now);

  // BR-MFA-07: Return recovery codes shown ONCE
  return {
    recovery_codes: rawRecoveryCodes,
  };
});
