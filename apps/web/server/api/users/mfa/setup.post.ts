import {
  encryptTotpSecret,
  generateTotpSecret,
  generateTotpUri,
} from "@mindkid/auth";
import { getOwnerDb, mfaSettings, users } from "@mindkid/db";
import { UserNotFoundError } from "@mindkid/errors/account";
import { MfaAlreadyEnabledError } from "@mindkid/errors/auth";
import { and, eq } from "drizzle-orm";
import { defineEventHandler } from "h3";
import { getMfaEncryptionKey } from "#server/utils/admin-auth-runtime";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

export default defineEventHandler(async (event) => {
  const session = requireWebUserSession(event);

  // BR-MFA-10: Setup requires recent reauth (<= 5 min)
  requireReauth(event);

  const db = getOwnerDb();
  const userId = session.user_id;

  // Get user email
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new UserNotFoundError("USER_NOT_FOUND");
  }

  // Upsert unconfirmed mfaSettings
  const [existing] = await db
    .select()
    .from(mfaSettings)
    .where(
      and(
        eq(mfaSettings.accountType, "user"),
        eq(mfaSettings.accountId, userId)
      )
    );

  // UC-052 BR-010: MFA đã xác nhận thì không phát khoá mới; thay thiết bị phải
  // đi qua tắt (cần xác thực lại cộng một mã hợp lệ, BR-003) hoặc khôi phục.
  if (existing?.confirmedAt) {
    throw new MfaAlreadyEnabledError(
      "Xác thực hai lớp đã được bật. Hãy tắt (kèm mã hợp lệ) trước khi thiết lập lại."
    );
  }

  // Generate TOTP secret via otpauth (BR-MFA-12)
  const secret = generateTotpSecret();
  const encryptedSecret = encryptTotpSecret(secret, getMfaEncryptionKey()); // BR-MFA-01, BR-MFA-13

  if (existing) {
    await db
      .update(mfaSettings)
      .set({
        secretEncrypted: encryptedSecret,
        confirmedAt: null,
      })
      .where(eq(mfaSettings.id, existing.id));
  } else {
    await db.insert(mfaSettings).values({
      accountType: "user",
      accountId: userId,
      secretEncrypted: encryptedSecret,
    });
  }

  const otpauthUrl = generateTotpUri(secret, user.email, "MindKid");

  return {
    secret,
    otpauth_url: otpauthUrl,
  };
});
