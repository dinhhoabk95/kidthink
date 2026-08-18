import {
  decryptTotpSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyTotpCode,
} from "@mindkid/auth";
import { getOwnerDb, mfaRecoveryCodes, mfaSettings, users } from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, readBody } from "h3";
import { requireWebUserSession } from "../../../utils/auth-runtime.js";

const MFA_SECRET_KEY =
  process.env.MFA_ENCRYPTION_KEY || "default_mfa_encryption_key_32bytes_!";

export default defineEventHandler(async (event) => {
  const session = requireWebUserSession(event);
  const userId = session.user_id;

  const body =
    (event.context?.body as Record<string, unknown>) ||
    ((event as Record<string, unknown>)._body as Record<string, unknown>) ||
    (await readBody(event).catch(() => ({})));

  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (code?.length !== 6) {
    throw createError({
      statusCode: 401,
      statusMessage: "MFA_INVALID_CODE",
      message: "Mã xác thực không đúng hoặc đã hết hạn",
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
    throw createError({
      statusCode: 404,
      statusMessage: "MFA_NOT_SETUP",
      message: "Chưa khởi tạo thiết lập MFA",
    });
  }

  const decryptedSecret = decryptTotpSecret(
    setting.secretEncrypted,
    MFA_SECRET_KEY
  );
  const isValid = verifyTotpCode(code, decryptedSecret); // BR-MFA-04, BR-MFA-12

  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: "MFA_INVALID_CODE",
      message: "Mã xác thực không chính xác",
    });
  }

  // Confirm MFA setting
  await db
    .update(mfaSettings)
    .set({ confirmedAt: new Date() })
    .where(eq(mfaSettings.id, setting.id));

  // BR-MFA-02: Generate 10 recovery codes, store hashes
  const rawRecoveryCodes = generateRecoveryCodes(10);

  // Clear old recovery codes if any
  await db
    .delete(mfaRecoveryCodes)
    .where(
      and(
        eq(mfaRecoveryCodes.accountType, "user"),
        eq(mfaRecoveryCodes.accountId, userId)
      )
    );

  // Insert new hashed codes (BR-MFA-02)
  await db.insert(mfaRecoveryCodes).values(
    rawRecoveryCodes.map((rawCode) => ({
      accountType: "user" as const,
      accountId: userId,
      codeHash: hashRecoveryCode(rawCode),
    }))
  );

  // BR-MFA-06: Revoke other sessions on MFA activation
  await db
    .update(users)
    .set({
      sessionVersion: (session.session_version || 0) + 1,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // BR-MFA-07: Return recovery codes shown ONCE
  return {
    recovery_codes: rawRecoveryCodes,
  };
});
