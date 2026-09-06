import {
  encryptTotpSecret,
  generateTotpSecret,
  generateTotpUri,
} from "@mindkid/auth";
import { getOwnerDb, mfaSettings, users } from "@mindkid/db";
import { UserNotFoundError } from "@mindkid/errors/account";
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

  // Generate TOTP secret via otpauth (BR-MFA-12)
  const secret = generateTotpSecret();
  const encryptedSecret = encryptTotpSecret(secret, getMfaEncryptionKey()); // BR-MFA-01, BR-MFA-13

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
