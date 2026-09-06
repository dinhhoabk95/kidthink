import {
  decryptTotpSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyTotpCode,
} from "@mindkid/auth";
import { getOwnerDb, mfaRecoveryCodes, mfaSettings, users } from "@mindkid/db";
import {
  MfaInvalidCodeError,
  MfaRequiredError,
  MfaSecretCorruptedError,
} from "@mindkid/errors/auth";
import { and, eq, sql } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";

import { getMfaEncryptionKey } from "#server/utils/admin-auth-runtime";
import { requireWebUserSession } from "#server/utils/auth-runtime";

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
    throw new MfaInvalidCodeError("Mã xác thực không chính xác");
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
      sessionVersion: sql`${users.sessionVersion} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // BR-MFA-07: Return recovery codes shown ONCE
  return {
    recovery_codes: rawRecoveryCodes,
  };
});
