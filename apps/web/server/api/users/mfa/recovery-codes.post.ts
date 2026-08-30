import {
  appError,
  decryptTotpSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyTotpCode,
} from "@mindkid/auth";
import { getOwnerDb, mfaRecoveryCodes, mfaSettings } from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { getMfaEncryptionKey } from "#server/utils/admin-auth-runtime";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

const recoveryCodesSchema = z.object({
  code: z.string().length(6),
});

export default defineEventHandler(async (event) => {
  const session = await requireWebUserSession(event);
  const userId = session.user_id;

  // BR-MFA-11: Regenerating recovery codes requires recent reauth (<= 5 min)
  requireReauth(event);

  const raw = event.context?.body ?? (await readBody(event).catch(() => ({})));

  const parsedResult = recoveryCodesSchema.safeParse(raw);
  if (!parsedResult.success) {
    throw createError({
      statusCode: 401,
      statusMessage: "MFA_INVALID_CODE",
      message: "Mã xác thực không hợp lệ",
    });
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

  if (!setting?.confirmedAt) {
    throw createError({
      statusCode: 404,
      statusMessage: "MFA_NOT_ENABLED",
      message: "Xác thực hai lớp chưa được bật",
    });
  }

  let decryptedSecret: string;
  try {
    decryptedSecret = decryptTotpSecret(
      setting.secretEncrypted,
      getMfaEncryptionKey()
    );
  } catch {
    // BR-MFA-13: decryption failure is a system error, not a wrong code
    throw appError("MFA_SECRET_CORRUPTED");
  }
  const isValid = verifyTotpCode(code, decryptedSecret);
  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: "MFA_INVALID_CODE",
      message: "Mã xác thực không chính xác",
    });
  }

  // BR-MFA-11: Invalidate ALL old recovery codes
  await db
    .delete(mfaRecoveryCodes)
    .where(
      and(
        eq(mfaRecoveryCodes.accountType, "user"),
        eq(mfaRecoveryCodes.accountId, userId)
      )
    );

  // Generate 10 new recovery codes
  const newRawCodes = generateRecoveryCodes(10);
  await db.insert(mfaRecoveryCodes).values(
    newRawCodes.map((rawCode) => ({
      accountType: "user" as const,
      accountId: userId,
      codeHash: hashRecoveryCode(rawCode),
    }))
  );

  return {
    recovery_codes: newRawCodes,
  };
});
