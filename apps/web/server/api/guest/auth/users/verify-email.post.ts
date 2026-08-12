import { appError, hashSecureToken } from "@kidthink/auth";
import { getAppDb, users, verificationTokens } from "@kidthink/db";
import { eq } from "drizzle-orm";
import { defineEventHandler, type H3Event, readBody } from "h3";
import { respondToUserAuthError } from "../../../../utils/auth-runtime";

export async function handleVerifyEmail(event: H3Event, testBody?: unknown) {
  try {
    const rawBody =
      testBody ??
      event.context?.body ??
      (await readBody(event).catch(() => null));

    if (!rawBody || typeof rawBody !== "object") {
      throw appError("VALIDATION_FAILED", {
        reason: "Dữ liệu yêu cầu không hợp lệ.",
      });
    }

    const payload = rawBody as Record<string, unknown>;
    const token = payload.token;

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      throw appError("VALIDATION_FAILED", {
        reason: "Mã xác thực là bắt buộc.",
      });
    }

    const db = getAppDb();
    const tokenHash = hashSecureToken(token.trim());

    const tokenRows = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.tokenHash, tokenHash));

    if (tokenRows.length === 0) {
      // BR-EVF-05: Generic NOT_FOUND error, never leak token or email
      throw appError("NOT_FOUND");
    }

    const vToken = tokenRows[0];
    if (vToken.purpose !== "email_verify") {
      throw appError("NOT_FOUND");
    }

    const now = new Date();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, vToken.accountId));

    if (!user) {
      throw appError("NOT_FOUND");
    }

    // BR-EVF-04: If token already used BUT user is active, return active smoothly
    if (vToken.usedAt !== null) {
      if (user.status === "active") {
        return { status: "active" };
      }
      throw appError("TOKEN_EXPIRED");
    }

    // Check expiration
    if (vToken.expiresAt <= now) {
      throw appError("TOKEN_EXPIRED");
    }

    // Update user status and token usedAt
    await db
      .update(users)
      .set({
        status: "active",
        emailVerifiedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, user.id));

    await db
      .update(verificationTokens)
      .set({ usedAt: now })
      .where(eq(verificationTokens.id, vToken.id));

    return { status: "active" };
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
}

export default defineEventHandler((event) => handleVerifyEmail(event));
