import { writeAudit } from "@mindkid/audit";
import {
  appError,
  decryptTotpSecret,
  generateRecoveryCodes,
  getAuthRedisClient,
  getBrowserSessionService,
  hashRecoveryCode,
  MfaChallengeService,
  verifyTotpCode,
} from "@mindkid/auth";
import {
  getAppSql,
  getOwnerDb,
  managers,
  mfaRecoveryCodes,
  mfaSettings,
  PostgresSessionStore,
} from "@mindkid/db";
import { enforceTwoAxisRateLimit } from "@mindkid/shared";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import {
  assertManagerRateLimitAllowed,
  assertManagerRequestBodySize,
  assertManagerSameOriginRequest,
  getManagerRemoteIp,
  getMfaEncryptionKey,
  setManagerRememberCookie,
} from "#server/utils/admin-auth-runtime";
import { getManagerSessionConfig } from "#server/utils/session-runtime";

const MfaSchema = z
  .object({
    challenge: z.string().min(1).max(4096),
    code: z.string().min(1).max(64),
  })
  .strict();

async function verifyManagerMfa(
  db: ReturnType<typeof getOwnerDb>,
  managerId: number,
  code: string
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
        getMfaEncryptionKey()
      );
      if (verifyTotpCode(code, secret)) {
        return { verified: true, recoveryCodeId: null };
      }
    } catch {
      // BR-MFA-13: decryption failure is a system error, not a wrong code
      throw appError("MFA_SECRET_CORRUPTED");
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
  assertManagerSameOriginRequest(event);
  assertManagerRequestBodySize(event, 16 * 1024);
  const body = (await readBody(event).catch(() => null)) ?? {};
  const parsed = MfaSchema.safeParse(body);
  if (!parsed.success) {
    throw appError("INVALID_CREDENTIALS");
  }
  const { challenge, code } = parsed.data;

  // Consume opaque Redis MFA challenge atomically (BR-AUT-35, BR-MME-03)
  const mfaChallengeService = new MfaChallengeService(getAuthRedisClient());
  const challengePayload = await mfaChallengeService
    .consumeChallenge("manager", challenge)
    .catch(() => {
      throw appError("INVALID_CREDENTIALS");
    });

  const db = getOwnerDb();
  const [manager] = await db
    .select()
    .from(managers)
    .where(eq(managers.id, challengePayload.accountId));

  if (!manager) {
    throw appError("INVALID_CREDENTIALS");
  }

  if (!manager.isActive) {
    throw appError("INSUFFICIENT_ROLE");
  }

  const rateLimit = await enforceTwoAxisRateLimit({
    routeClass: "auth:mfa",
    remoteIp: getManagerRemoteIp(event),
    accountIdentifier: String(manager.id),
  });
  assertManagerRateLimitAllowed(rateLimit.statusCode);

  const [mfaSetting] = await db
    .select()
    .from(mfaSettings)
    .where(
      and(
        eq(mfaSettings.accountType, "manager"),
        eq(mfaSettings.accountId, manager.id)
      )
    );

  const isFirstEnrollment =
    !manager.mfaEnabled && (!mfaSetting || mfaSetting.confirmedAt === null);

  const mfaResult = await verifyManagerMfa(db, manager.id, code);
  if (
    !mfaResult.verified ||
    (isFirstEnrollment && mfaResult.recoveryCodeId !== null)
  ) {
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

  let recoveryCodesToReturn: string[] | undefined;

  if (isFirstEnrollment) {
    // BR-MME-05, BR-MME-06: Complete enrollment in ONE single transaction
    const rawRecoveryCodes = generateRecoveryCodes(10);
    recoveryCodesToReturn = rawRecoveryCodes;

    await db.transaction(async (tx) => {
      await tx
        .update(mfaSettings)
        .set({ confirmedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(mfaSettings.accountType, "manager"),
            eq(mfaSettings.accountId, manager.id)
          )
        );

      await tx
        .update(managers)
        .set({ mfaEnabled: true, updatedAt: new Date() })
        .where(eq(managers.id, manager.id));

      await tx.insert(mfaRecoveryCodes).values(
        rawRecoveryCodes.map((c) => ({
          accountType: "manager" as const,
          accountId: manager.id,
          codeHash: hashRecoveryCode(c),
        }))
      );

      await writeAudit(tx, {
        actor_type: "manager",
        actor_id: manager.id,
        action: "manager_mfa_enrolled",
        entity_type: "manager",
        entity_id: manager.id.toString(),
      });
    });
  } else if (mfaResult.recoveryCodeId === null) {
    await db.transaction(async (tx) => {
      await writeAudit(tx, {
        actor_type: "manager",
        actor_id: manager.id,
        action: "manager_login",
        entity_type: "manager",
        entity_id: manager.id.toString(),
      });
    });
  } else {
    const recoveryCodeId = mfaResult.recoveryCodeId;
    await db.transaction(async (tx) => {
      const [claimed] = await tx
        .update(mfaRecoveryCodes)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(mfaRecoveryCodes.id, recoveryCodeId),
            isNull(mfaRecoveryCodes.usedAt)
          )
        )
        .returning({ id: mfaRecoveryCodes.id });
      if (!claimed) {
        throw appError("INVALID_CREDENTIALS");
      }
      await writeAudit(tx, {
        actor_type: "manager",
        actor_id: manager.id,
        action: "manager_login",
        entity_type: "manager",
        entity_id: manager.id.toString(),
      });
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

  await setUserSession(
    event,
    {
      secure: {
        session_token: createdSession.sessionToken,
      },
    },
    getManagerSessionConfig()
  );

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
    ...(recoveryCodesToReturn ? { recovery_codes: recoveryCodesToReturn } : {}),
  };
});
