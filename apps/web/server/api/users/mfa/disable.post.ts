import {
  decryptTotpSecret,
  hashRecoveryCode,
  verifyTotpCode,
} from "@mindkid/auth";
import { getOwnerDb, mfaRecoveryCodes, mfaSettings } from "@mindkid/db";
import {
  MfaInvalidCodeError,
  MfaSecretCorruptedError,
} from "@mindkid/errors/auth";
import { ValidationError } from "@mindkid/errors/common";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { getMfaEncryptionKey } from "#server/utils/admin-auth-runtime";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

const TOTP_REGEX = /^\d{6}$/;

import { z } from "zod";

const disableMfaSchema = z.object({
  code: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const session = await requireWebUserSession(event);
  const userId = session.user_id;

  // BR-MFA-03: Disable requires recent reauth (<= 5 min)
  requireReauth(event);

  const raw = event.context?.body ?? (await readBody(event).catch(() => ({})));

  const parsedResult = disableMfaSchema.safeParse(raw);
  if (!parsedResult.success) {
    throw new ValidationError(
      "Tắt xác thực hai lớp bắt buộc cung cấp mã TOTP hoặc mã khôi phục (BR-MFA-03)"
    );
  }

  const code = parsedResult.data.code.trim();

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
    return { success: true };
  }

  let isCodeValid = false;

  // 1. Try TOTP validation
  if (code.length === 6 && TOTP_REGEX.test(code)) {
    try {
      const decryptedSecret = decryptTotpSecret(
        setting.secretEncrypted,
        getMfaEncryptionKey()
      );
      isCodeValid = verifyTotpCode(code, decryptedSecret);
    } catch {
      // BR-MFA-13: decryption failure is a system error, not a wrong code
      throw new MfaSecretCorruptedError();
    }
  }

  // 2. If not valid TOTP, try recovery code validation (BR-MFA-03)
  if (!isCodeValid) {
    const codeHash = hashRecoveryCode(code);
    const [matchedCode] = await db
      .select()
      .from(mfaRecoveryCodes)
      .where(
        and(
          eq(mfaRecoveryCodes.accountType, "user"),
          eq(mfaRecoveryCodes.accountId, userId),
          eq(mfaRecoveryCodes.codeHash, codeHash),
          isNull(mfaRecoveryCodes.usedAt)
        )
      );

    if (matchedCode) {
      isCodeValid = true;
      // Mark recovery code as used (BR-MFA-02)
      await db
        .update(mfaRecoveryCodes)
        .set({ usedAt: new Date() })
        .where(eq(mfaRecoveryCodes.id, matchedCode.id));
    }
  }

  if (!isCodeValid) {
    throw new MfaInvalidCodeError("Mã xác thực không hợp lệ");
  }

  // Delete mfaSettings and all recovery codes
  await db
    .delete(mfaSettings)
    .where(
      and(
        eq(mfaSettings.accountType, "user"),
        eq(mfaSettings.accountId, userId)
      )
    );

  await db
    .delete(mfaRecoveryCodes)
    .where(
      and(
        eq(mfaRecoveryCodes.accountType, "user"),
        eq(mfaRecoveryCodes.accountId, userId)
      )
    );

  return {
    success: true,
  };
});
