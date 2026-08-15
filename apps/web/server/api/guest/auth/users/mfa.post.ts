import {
  appError,
  decryptTotpSecret,
  getAuthRedisClient,
  getBrowserSessionService,
  hashRecoveryCode,
  MfaChallengeService,
  verifyTotpCode,
} from "@kidthink/auth";
import {
  getAppSql,
  getOwnerDb,
  mfaRecoveryCodes,
  mfaSettings,
  PostgresSessionStore,
  users,
} from "@kidthink/db";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { setUserSession } from "#imports";
import { respondToUserAuthError } from "../../../../utils/auth-runtime.js";

const MFA_SECRET_KEY =
  process.env.MFA_ENCRYPTION_KEY || "default_mfa_encryption_key_32bytes_!";

const MfaSchema = z
  .object({
    challenge: z.string().min(1).max(4096),
    code: z.string().min(1).max(64),
  })
  .strict();

async function verifyUserMfa(
  db: ReturnType<typeof getOwnerDb>,
  userId: number,
  code: string,
  encryptionSecret: string
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
        encryptionSecret
      );
      if (verifyTotpCode(code, secret)) {
        return { verified: true, recoveryCodeId: null };
      }
    } catch {
      // Ignore
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
  try {
    const body =
      (await readBody(event).catch(() => null)) ||
      (event as Record<string, unknown>)._body ||
      {};
    const parsed = MfaSchema.safeParse(body);
    if (!parsed.success) {
      throw appError("INVALID_CREDENTIALS");
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
      throw appError("INVALID_CREDENTIALS");
    }

    const mfaResult = await verifyUserMfa(db, user.id, code, MFA_SECRET_KEY);

    if (!mfaResult.verified) {
      throw appError("INVALID_CREDENTIALS");
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
  } catch (err) {
    return respondToUserAuthError(event, err);
  }
});
