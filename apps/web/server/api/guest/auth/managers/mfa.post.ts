import { createHash } from "node:crypto";
import {
  appError,
  createAdminManagerToken,
  decryptTotpSecret,
  hashRecoveryCode,
  verifyMfaChallengeToken,
  verifyTotpCode,
} from "@kidthink/auth";
import { checkRateLimit } from "@kidthink/cache";
import {
  getOwnerDb,
  managers,
  mfaRecoveryCodes,
  mfaSettings,
  writeAudit,
} from "@kidthink/db";
import { enforceTwoAxisRateLimit } from "@kidthink/shared";

import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import {
  assertManagerRateLimitAllowed,
  assertManagerRequestBodySize,
  assertManagerSameOriginRequest,
  getAdminJwtSecret,
  getManagerRefreshService,
  getManagerRemoteIp,
  respondToManagerAuthError,
  setManagerAuthCookies,
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
      // Plaintext TOTP rows are deliberately rejected. They must be migrated
      // with encryptTotpSecret before production login is enabled.
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

    const { managerId } = await verifyMfaChallengeToken({
      token: challenge,
      secret: getAdminJwtSecret(event),
    });

    const db = getOwnerDb();
    const [manager] = await db
      .select()
      .from(managers)
      .where(eq(managers.id, managerId));

    if (!manager?.isActive) {
      throw appError("INSUFFICIENT_ROLE");
    }

    const rateLimit = await enforceTwoAxisRateLimit({
      routeClass: "auth:mfa",
      remoteIp: getManagerRemoteIp(event),
      accountIdentifier: String(managerId),
    });
    assertManagerRateLimitAllowed(rateLimit.statusCode);

    const mfaResult = await verifyManagerMfa(
      db,
      managerId,
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

    const challengeKey = createHash("sha256").update(challenge).digest("hex");
    let challengeReplayCheck: Awaited<ReturnType<typeof checkRateLimit>>;
    try {
      challengeReplayCheck = await checkRateLimit(
        `auth:mfa:challenge:${challengeKey}`,
        1,
        5 * 60
      );
    } catch {
      throw appError("SERVICE_UNAVAILABLE");
    }
    if (!challengeReplayCheck.allowed) {
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

    const sessionResult = await getManagerRefreshService(event).createSession({
      account: { type: "manager", id: manager.id },
      authMethod: "password",
      deviceLabel: "manager-mfa",
      ipAddress: getManagerRemoteIp(event),
      refreshTokenVersion: manager.refreshTokenVersion,
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

    const accessToken = await createAdminManagerToken({
      payload: {
        manager_id: manager.id,
        display_name: manager.displayName,
        session_id: sessionResult.sessionId,
        refresh_token_version: manager.refreshTokenVersion,
        role: manager.role,
      },
      secret: getAdminJwtSecret(event),
    });
    setManagerAuthCookies(event, accessToken, sessionResult.refreshEnvelope);

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
