import { appError, generateSecureToken, hashSecureToken } from "@kidthink/auth";
import {
  getAppDb,
  notifications,
  users,
  verificationTokens,
} from "@kidthink/db";
import { enforceTwoAxisRateLimit } from "@kidthink/shared";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, getHeader, type H3Event, readBody } from "h3";
import { respondToUserAuthError } from "../../../../utils/auth-runtime";

export async function handleForgotPassword(event: H3Event, testBody?: unknown) {
  try {
    const rawIp =
      getHeader(event, "x-forwarded-for")?.split(",")[0] ||
      getHeader(event, "x-real-ip") ||
      "127.0.0.1";

    const rawBody =
      testBody ??
      event.context?.body ??
      (await readBody(event).catch(() => null));
    const payload = (
      rawBody && typeof rawBody === "object" ? rawBody : {}
    ) as Record<string, unknown>;

    const email =
      typeof payload.email === "string"
        ? payload.email.trim().toLowerCase()
        : undefined;

    if (!email?.includes("@")) {
      throw appError("VALIDATION_FAILED", {
        reason: "Địa chỉ email không hợp lệ.",
      });
    }

    // BR-PWR-04: Rate limit forgot password
    const rateLimitRes = await enforceTwoAxisRateLimit({
      routeClass: "auth:register",
      remoteIp: rawIp,
      accountIdentifier: email,
    });

    if (rateLimitRes.statusCode === 429) {
      throw appError("RATE_LIMITED");
    }

    const db = getAppDb();
    const [user] = await db.select().from(users).where(eq(users.email, email));

    // BR-PWR-02: Always return { ok: true } to prevent email enumeration
    if (!user || user.status === "suspended" || user.status === "deleted") {
      return { ok: true };
    }

    const now = new Date();

    // BR-PWR-03: Invalidate previous unused password_reset tokens
    await db
      .update(verificationTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(verificationTokens.accountId, user.id),
          eq(verificationTokens.purpose, "password_reset"),
          isNull(verificationTokens.usedAt)
        )
      );

    const rawToken = generateSecureToken();
    const tokenHash = hashSecureToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h per BR-PWR-01

    await db.insert(verificationTokens).values({
      accountType: "user",
      accountId: user.id,
      purpose: "password_reset",
      tokenHash,
      expiresAt,
    });

    await db.insert(notifications).values({
      recipientType: "user",
      recipientId: user.id,
      channel: "email",
      templateCode: "password_reset",
      payload: {
        token: rawToken,
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

export default defineEventHandler((event) => handleForgotPassword(event));
