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
  managers,
  mfaRecoveryCodes,
  mfaSettings,
  PostgresSessionStore,
  writeAudit,
} from "@kidthink/db";
import { enforceTwoAxisRateLimit } from "@kidthink/shared";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { setUserSession } from "#imports";
import {
  assertManagerRateLimitAllowed,
  assertManagerRequestBodySize,
  assertManagerSameOriginRequest,
  getAdminJwtSecret,
  getManagerRemoteIp,
  respondToManagerAuthError,
  setManagerRememberCookie,
} from "../../../../utils/admin-auth-runtime.js";

const MfaSchema = z
  .object({
    challenge: z.string().min(1).max(4096),
    code: z.string().min(1).max(64),
  })
  .strict();

async function verifyManagerMfa(
  db: ReturnType<typeof getOwnerDb>,
  managerId: number,
  code: string,
  encryptionSecret: string
): Promise<{ verified: boolean; recoveryCodeId: number | null }> {
  const [mfaSetting] = await db
    .select()
    .from(mfaSettings)
    .where(
      and(
        eq(mfaSettings.accountType, "manager"),
        eq(mfaSettings.accountId, managerId)
      )
    );

  if (mfaSetting?.secretEncrypted) {
    try {
      const secret = decryptTotpSecret(
        mfaSetting.secretEncrypted,
        encryptionSecret
      );
      if (verifyTotpCode(code, secret)) {
        return { verified: true, recoveryCodeId: null };
      }
    } catch {
      // Plaintext TOTP rows are deliberately rejected.
    }
  }

  const [recoveryCode] = await db
    .select({ id: mfaRecoveryCodes.id })
    .from(mfaRecoveryCodes)
    .where(
      and(
        eq(mfaRecoveryCodes.accountType, "manager"),
        eq(mfaRecoveryCodes.accountId, managerId),
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
    assertManagerSameOriginRequest(event);
    assertManagerRequestBodySize(event, 16 * 1024);
    const body = (await readBody(event).catch(() => null)) || event._body || {};
    const parsed = MfaSchema.safeParse(body);
    if (!parsed.success) {
      throw appError("INVALID_CREDENTIALS");
    }
    const { challenge, code } = parsed.data;

    // Consume opaque Redis MFA challenge atomically (BR-AUT-35)
    const mfaChallengeService = new MfaChallengeService(getAuthRedisClient());
    const challengePayload = await mfaChallengeService.consumeChallenge(
      "manager",
      challenge
    );

    const db = getOwnerDb();
    const [manager] = await db
      .select()
      .from(managers)
      .where(eq(managers.id, challengePayload.accountId));

    if (!manager?.isActive) {
      throw appError("INSUFFICIENT_ROLE");
    }

    const rateLimit = await enforceTwoAxisRateLimit({
      routeClass: "auth:mfa",
      remoteIp: getManagerRemoteIp(event),
      accountIdentifier: String(manager.id),
    });
    assertManagerRateLimitAllowed(rateLimit.statusCode);

    const mfaResult = await verifyManagerMfa(
      db,
      manager.id,
      code,
      getAdminJwtSecret(event)
    );
    if (!mfaResult.verified) {
      await db.transaction(async (tx) => {
        await writeAudit(tx, {
          actor_type: "manager",
          actor_id: manager.id,
          action: "manager_mfa_failed",
          entity_type: "manager",
          entity_id: manager.id.toString(),
          reason: "Invalid MFA code or recovery code",
        });
      });
      throw appError("INVALID_CREDENTIALS");
    }

    if (mfaResult.recoveryCodeId !== null) {
      await db.transaction(async (tx) => {
        const [claimed] = await tx
          .update(mfaRecoveryCodes)
          .set({ usedAt: new Date() })
          .where(
            and(
              eq(mfaRecoveryCodes.id, mfaResult.recoveryCodeId),
              isNull(mfaRecoveryCodes.usedAt)
            )
          )
          .returning({ id: mfaRecoveryCodes.id });
        if (!claimed) {
          throw appError("INVALID_CREDENTIALS");
        }
      });
    }

    // MFA success! Create opaque manager session in Redis
    const sessionService = getBrowserSessionService();
    const createdSession = await sessionService.create({
      namespace: "manager",
      accountId: manager.id,
      displayName: manager.displayName,
      role: manager.role,
      rememberMe: challengePayload.rememberMe,
      ipAddress: getManagerRemoteIp(event),
    });

    await db.transaction(async (tx) => {
      await writeAudit(tx, {
        actor_type: "manager",
        actor_id: manager.id,
        action: "manager_login",
        entity_type: "manager",
        entity_id: manager.id.toString(),
      });
    });

    await setUserSession(event, {
      secure: {
        session_token: createdSession.sessionToken,
      },
    });

    if (createdSession.rememberToken) {
      setManagerRememberCookie(event, createdSession.rememberToken);
    }

    // Record PG metadata
    const pgStore = new PostgresSessionStore(getAppSql());
    await pgStore
      .recordSession({
        account_type: "manager",
        account_id: manager.id,
        device_id: createdSession.deviceId,
        remembered: !!challengePayload.rememberMe,
        device_label: "manager-mfa",
        ip_address: getManagerRemoteIp(event),
        auth_method: "password",
        expires_at: createdSession.expiresAt,
      })
      .catch(() => null);

    return {
      status: "ok",
      manager: {
        id: manager.id,
        email: manager.email,
        display_name: manager.displayName,
        role: manager.role,
      },
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
