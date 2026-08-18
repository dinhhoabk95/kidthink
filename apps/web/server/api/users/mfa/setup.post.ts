import {
  encryptTotpSecret,
  generateTotpSecret,
  generateTotpUri,
} from "@mindkid/auth";
import { getOwnerDb, mfaSettings, users } from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler } from "h3";
import { requireWebUserSession } from "../../../utils/auth-runtime.js";
import { requireReauth } from "../../../utils/reauth-runtime.js";

const MFA_SECRET_KEY =
  process.env.MFA_ENCRYPTION_KEY || "default_mfa_encryption_key_32bytes_!";

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
    throw createError({ statusCode: 404, statusMessage: "USER_NOT_FOUND" });
  }

  // Generate TOTP secret via otpauth (BR-MFA-12)
  const secret = generateTotpSecret();
  const encryptedSecret = encryptTotpSecret(secret, MFA_SECRET_KEY); // BR-MFA-01

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

  const otpauthUrl = generateTotpUri(secret, user.email, "TiniMath");

  return {
    secret,
    otpauth_url: otpauthUrl,
  };
});
