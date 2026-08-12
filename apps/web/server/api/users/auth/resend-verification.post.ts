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
import { respondToUserAuthError } from "../../../utils/auth-runtime";

export async function handleResendVerification(
  event: H3Event,
  testBody?: unknown
) {
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

    // BR-EVF-07: Rate limit resend
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

    // BR-EVF-05: Always return 200 { ok: true }, never leak whether user exists or is active
    if (user?.status !== "pending_verification") {
      return { ok: true };
    }

    const now = new Date();

    // BR-EVF-03: Invalidate old active verification tokens for this user
    await db
      .update(verificationTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(verificationTokens.accountId, user.id),
          eq(verificationTokens.purpose, "email_verify"),
          isNull(verificationTokens.usedAt)
        )
      );

    // Generate new token valid for 24h
    const rawToken = generateSecureToken();
    const tokenHash = hashSecureToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(verificationTokens).values({
      accountType: "user",
      accountId: user.id,
      purpose: "email_verify",
      tokenHash,
      expiresAt,
    });

    // Create notification
    await db.insert(notifications).values({
      recipientType: "user",
      recipientId: user.id,
      channel: "email",
      templateCode: "email_verification",
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

export default defineEventHandler((event) => handleResendVerification(event));
