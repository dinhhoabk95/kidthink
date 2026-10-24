import {
  completeMfaChallenge,
  decryptTotpSecret,
  getAuthRedisClient,
  getBrowserSessionService,
  hashRecoveryCode,
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
import {
  ensureUserCsrfCookie,
  getVerifiedRemoteIp,
  setUserRememberCookie,
} from "#server/utils/auth-runtime";

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
  const body =
    (event.context as { body?: Record<string, string> })?.body ??
    (await readBody(event).catch(() => null)) ??
    {};
  const parsed = MfaSchema.safeParse(body);
  if (!parsed.success) {
    throw new InvalidCredentialsError();
  }
  const { challenge, code } = parsed.data;

  // UC-052 A1/A2/BR-013: sai mã giữ thử thách để nhập lại, 5 lần sai khoá 15 phút.
  // Thử thách chỉ bị tiêu thụ khi mã đúng (BR-AUT-35, BR-MFA-09).
  const db = getOwnerDb();
  const verified: {
    account: typeof users.$inferSelect | null;
    recoveryCodeId: number | null;
  } = { account: null, recoveryCodeId: null };
  const challengePayload = await completeMfaChallenge({
    redis: getAuthRedisClient(),
    namespace: "user",
    challengeToken: challenge,
    verify: async (payload) => {
      const [account] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.accountId));
      if (
        !account ||
        account.status === "deleted" ||
        account.status === "suspended"
      ) {
        throw new InvalidCredentialsError();
      }
      const result = await verifyUserMfa(db, account.id, code);
      verified.account = account;
      verified.recoveryCodeId = result.recoveryCodeId;
      return result.verified;
    },
  });

  const user = verified.account;
  if (!user) {
    throw new InvalidCredentialsError();
  }

  // Mã khôi phục dùng đúng một lần (BR-MFA-02): hai request song song chỉ một request thắng.
  if (verified.recoveryCodeId !== null) {
    const [claimed] = await db
      .update(mfaRecoveryCodes)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(mfaRecoveryCodes.id, verified.recoveryCodeId),
          isNull(mfaRecoveryCodes.usedAt)
        )
      )
      .returning({ id: mfaRecoveryCodes.id });
    if (!claimed) {
      throw new InvalidCredentialsError();
    }
  }

  // Create user session in Redis
  const clientIp = getVerifiedRemoteIp(event);
  const sessionService = getBrowserSessionService();
  const createdSession = await sessionService.create({
    namespace: "user",
    accountId: user.id,
    displayName: user.displayName,
    rememberMe: challengePayload.rememberMe,
    ipAddress: clientIp,
  });

  await setUserSession(event, {
    secure: {
      session_token: createdSession.sessionToken,
    },
  });

  if (createdSession.rememberToken) {
    setUserRememberCookie(event, createdSession.rememberToken);
  }
  ensureUserCsrfCookie(event);

  // Record PG metadata
  const pgStore = new PostgresSessionStore(getAppSql());
  await pgStore
    .recordSession({
      account_type: "user",
      account_id: user.id,
      device_id: createdSession.deviceId,
      remembered: !!challengePayload.rememberMe,
      device_label: "user-mfa",
      ip_address: clientIp,
      auth_method: "password",
      expires_at: createdSession.expiresAt,
    })
    .catch(() => null);

  return {
    status: "ok",
    user: {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      display_name: user.displayName,
    },
  };
});
