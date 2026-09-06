import {
  decryptTotpSecret,
  getAuthRedisClient,
  getBrowserSessionService,
  hashRecoveryCode,
  MfaChallengeService,
  verifyTotpCode,
} from "@mindkid/auth";
import {
  getAppSql,
  getOwnerDb,
  mfaRecoveryCodes,
  mfaSettings,
  PostgresSessionStore,
  users,
} from "@mindkid/db";
import {
  InvalidCredentialsError,
  MfaSecretCorruptedError,
} from "@mindkid/errors/auth";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";

import { getMfaEncryptionKey } from "#server/utils/admin-auth-runtime";

const MfaSchema = z
  .object({
    challenge: z.string().min(1).max(4096),
    code: z.string().min(1).max(64),
  })
  .strict();

async function verifyUserMfa(
  db: ReturnType<typeof getOwnerDb>,
  userId: number,
  code: string
): Promise<{ verified: boolean; recoveryCodeId: number | null }> {
  const [mfaSetting] = await db
    .select()
    .from(mfaSettings)
    .where(
      and(
        eq(mfaSettings.accountType, "user"),
        eq(mfaSettings.accountId, userId)
      )
    );

  if (mfaSetting?.secretEncrypted && mfaSetting.confirmedAt) {
    try {
      const secret = decryptTotpSecret(
        mfaSetting.secretEncrypted,
        getMfaEncryptionKey()
      );
      if (verifyTotpCode(code, secret)) {
        return { verified: true, recoveryCodeId: null };
      }
    } catch {
      // BR-MFA-13: decryption failure is a system error, not a wrong code
      throw new MfaSecretCorruptedError();
    }
  }

  const [recoveryCode] = await db
    .select({ id: mfaRecoveryCodes.id })
    .from(mfaRecoveryCodes)
    .where(
      and(
        eq(mfaRecoveryCodes.accountType, "user"),
        eq(mfaRecoveryCodes.accountId, userId),
        eq(mfaRecoveryCodes.codeHash, hashRecoveryCode(code)),
        isNull(mfaRecoveryCodes.usedAt)
      )
    );

  return {
    verified: recoveryCode !== undefined,
    recoveryCodeId: recoveryCode?.id ?? null,
  };
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event).catch(() => null)) ?? {};
  const parsed = MfaSchema.safeParse(body);
  if (!parsed.success) {
    throw new InvalidCredentialsError();
  }
  const { challenge, code } = parsed.data;

  // Consume opaque Redis MFA challenge (BR-AUT-35, BR-MFA-09)
  const mfaChallengeService = new MfaChallengeService(getAuthRedisClient());
  const challengePayload = await mfaChallengeService.consumeChallenge(
    "user",
    challenge
  );

  const db = getOwnerDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, challengePayload.accountId));

  if (!user || user.status === "deleted" || user.status === "suspended") {
    throw new InvalidCredentialsError();
  }

  const mfaResult = await verifyUserMfa(db, user.id, code);

  if (!mfaResult.verified) {
    throw new InvalidCredentialsError();
  }

  // If recovery code used, mark it as consumed (BR-MFA-02)
  if (mfaResult.recoveryCodeId !== null) {
    await db
      .update(mfaRecoveryCodes)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(mfaRecoveryCodes.id, mfaResult.recoveryCodeId),
          isNull(mfaRecoveryCodes.usedAt)
        )
      );
  }

  // Create user session in Redis
  const sessionService = getBrowserSessionService();
  const createdSession = await sessionService.create({
    namespace: "user",
    accountId: user.id,
    displayName: user.displayName,
    rememberMe: challengePayload.rememberMe,
    ipAddress: "127.0.0.1",
  });

  await setUserSession(event, {
    secure: {
      session_token: createdSession.sessionToken,
    },
  });

  // Record PG metadata
  const pgStore = new PostgresSessionStore(getAppSql());
  await pgStore
    .recordSession({
      account_type: "user",
      account_id: user.id,
      device_id: createdSession.deviceId,
      remembered: !!challengePayload.rememberMe,
      device_label: "user-mfa",
      ip_address: "127.0.0.1",
      auth_method: "password",
      expires_at: createdSession.expiresAt,
    })
    .catch(() => null);

  return {
    status: "ok",
    user: {
      id: user.id,
      email: user.email,
      display_name: user.displayName,
    },
  };
});
