import {
  decryptTotpSecret,
  hashRecoveryCode,
  verifyTotpCode,
} from "@mindkid/auth";
import { getOwnerDb, mfaRecoveryCodes, mfaSettings } from "@mindkid/db";
import { and, eq, isNull } from "drizzle-orm";
import { createError, defineEventHandler, readBody } from "h3";
import { requireWebUserSession } from "../../../utils/auth-runtime.js";
import { requireReauth } from "../../../utils/reauth-runtime.js";

const MFA_SECRET_KEY =
  process.env.MFA_ENCRYPTION_KEY || "default_mfa_encryption_key_32bytes_!";
const TOTP_REGEX = /^\d{6}$/;

export default defineEventHandler(async (event) => {
  const session = requireWebUserSession(event);
  const userId = session.user_id;

  // BR-MFA-03: Disable requires recent reauth (<= 5 min)
  requireReauth(event);

  const body =
    (event.context?.body as Record<string, unknown>) ||
    ((event as Record<string, unknown>)._body as Record<string, unknown>) ||
    (await readBody(event).catch(() => ({})));

  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!code) {
    throw createError({
      statusCode: 422,
      statusMessage: "CODE_REQUIRED",
      message:
        "Tắt xác thực hai lớp bắt buộc cung cấp mã TOTP hoặc mã khôi phục (BR-MFA-03)",
    });
  }

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
        MFA_SECRET_KEY
      );
      isCodeValid = verifyTotpCode(code, decryptedSecret);
    } catch {
      isCodeValid = false;
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
    throw createError({
      statusCode: 401,
      statusMessage: "MFA_INVALID_CODE",
      message: "Mã xác thực không hợp lệ",
    });
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
