import {
  appError,
  createAdminManagerToken,
  createRefreshToken,
  hashRecoveryCode,
  hashRefreshToken,
  verifyMfaChallengeToken,
  verifyTotpCode,
} from "@kidthink/auth";
import {
  activeSessions,
  getOwnerDb,
  managers,
  mfaRecoveryCodes,
  mfaSettings,
  writeAudit,
} from "@kidthink/db";

import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, readBody, setCookie } from "h3";
import {
  getAdminJwtSecret,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.js";

const MANAGER_REFRESH_TTL_SECONDS = 24 * 60 * 60; // 24 hours max (BR-ADA-07)

export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody(event).catch(() => null)) || event._body || {};
    const { challenge, code } = body;

    if (
      !(challenge && code) ||
      typeof challenge !== "string" ||
      typeof code !== "string"
    ) {
      throw appError("INVALID_CREDENTIALS");
    }

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

    let mfaVerified = false;
    let usedRecoveryCodeId: number | null = null;

    // 1. Check TOTP settings
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
      mfaVerified = verifyTotpCode(code, mfaSetting.secretEncrypted);
    }

    // 2. If TOTP failed, check recovery codes
    if (!mfaVerified) {
      const inputHash = hashRecoveryCode(code);
      const [recCode] = await db
        .select()
        .from(mfaRecoveryCodes)
        .where(
          and(
            eq(mfaRecoveryCodes.accountType, "manager"),
            eq(mfaRecoveryCodes.accountId, managerId),
            eq(mfaRecoveryCodes.codeHash, inputHash),
            isNull(mfaRecoveryCodes.usedAt)
          )
        );

      if (recCode) {
        mfaVerified = true;
        usedRecoveryCodeId = recCode.id;
      }
    }

    if (!mfaVerified) {
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

    // Update recovery code if used
    if (usedRecoveryCodeId) {
      await db
        .update(mfaRecoveryCodes)
        .set({ usedAt: new Date() })
        .where(eq(mfaRecoveryCodes.id, usedRecoveryCodeId));
    }

    const sessionId = `m_sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const secret = getAdminJwtSecret(event);

    const accessToken = await createAdminManagerToken({
      payload: {
        manager_id: manager.id,
        display_name: manager.displayName,
        session_id: sessionId,
        refresh_token_version: manager.refreshTokenVersion,
        role: manager.role,
      },
      secret,
    });

    const rawRefreshToken = createRefreshToken({
      namespace: "manager",
      sessionId,
      refreshTokenVersion: manager.refreshTokenVersion,
      secret,
    });
    const refreshTokenHash = hashRefreshToken(rawRefreshToken);

    const expiresAt = new Date(Date.now() + MANAGER_REFRESH_TTL_SECONDS * 1000);

    // Save active_sessions row & write audit manager_login in transaction
    await db.transaction(async (tx) => {
      await tx.insert(activeSessions).values({
        accountType: "manager",
        accountId: manager.id,
        refreshTokenHash,
        authMethod: "password",
        expiresAt,
      });

      await writeAudit(tx, {
        actor_type: "manager",
        actor_id: manager.id,
        action: "manager_login",
        entity_type: "manager",
        entity_id: manager.id.toString(),
      });
    });

    if (event?.node?.res?.setHeader) {
      setCookie(event, "kidthink_admin_token", accessToken, {
        httpOnly: true,
        maxAge: MANAGER_REFRESH_TTL_SECONDS,
        path: "/",
        sameSite: "strict",
        secure: !import.meta.dev,
      });
    }

    return {
      status: "ok",
      access_token: accessToken,
      refresh_token: rawRefreshToken,
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
