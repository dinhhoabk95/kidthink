import {
  appError,
  hashPassword,
  hashSecureToken,
  validatePasswordStrength,
} from "@kidthink/auth";
import {
  activeSessions,
  getAppDb,
  notifications,
  users,
  verificationTokens,
} from "@kidthink/db";
import { eq } from "drizzle-orm";
import { defineEventHandler, type H3Event, readBody } from "h3";
import { respondToUserAuthError } from "../../../../utils/auth-runtime";

export async function handleResetPassword(event: H3Event, testBody?: unknown) {
  try {
    const rawBody =
      testBody ??
      event.context?.body ??
      (await readBody(event).catch(() => null));
    const payload = (
      rawBody && typeof rawBody === "object" ? rawBody : {}
    ) as Record<string, unknown>;

    const token = typeof payload.token === "string" ? payload.token.trim() : "";
    const newPassword =
      typeof payload.new_password === "string" ? payload.new_password : "";

    if (!token) {
      throw appError("VALIDATION_FAILED", {
        reason: "Mã xác thực là bắt buộc.",
      });
    }

    const passVal = validatePasswordStrength(newPassword);
    if (!passVal.valid) {
      throw appError("VALIDATION_FAILED", {
        reason: passVal.reason || "Mật khẩu mới không đạt yêu cầu an toàn.",
      });
    }

    const db = getAppDb();
    const tokenHash = hashSecureToken(token);

    const tokenRows = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.tokenHash, tokenHash));

    if (tokenRows.length === 0 || tokenRows[0].purpose !== "password_reset") {
      throw appError("NOT_FOUND");
    }

    const vToken = tokenRows[0];
    if (vToken.usedAt !== null || vToken.expiresAt <= new Date()) {
      throw appError("TOKEN_EXPIRED");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, vToken.accountId));

    if (!user) {
      throw appError("NOT_FOUND");
    }

    const newPassHash = await hashPassword(newPassword);
    const now = new Date();

    // BR-PWR-07: Update password, bump refresh_token_version, mark token used
    await db
      .update(users)
      .set({
        passwordHash: newPassHash,
        refreshTokenVersion: user.refreshTokenVersion + 1,
        updatedAt: now,
      })
      .where(eq(users.id, user.id));

    await db
      .update(verificationTokens)
      .set({ usedAt: now })
      .where(eq(verificationTokens.id, vToken.id));

    // BR-PWR-07: Revoke all active sessions for this account
    await db
      .delete(activeSessions)
      .where(eq(activeSessions.accountId, user.id));

    // Queue notification
    await db.insert(notifications).values({
      recipientType: "user",
      recipientId: user.id,
      channel: "email",
      templateCode: "password_changed",
      payload: {
        email: user.email,
        displayName: user.displayName,
      },
      status: "queued",
    });

    return { ok: true };
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
}

export default defineEventHandler((event) => handleResetPassword(event));
