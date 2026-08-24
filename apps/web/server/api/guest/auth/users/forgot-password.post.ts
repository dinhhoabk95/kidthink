import { appError, generateSecureToken, hashSecureToken } from "@mindkid/auth";
import {
  getAppDb,
  notifications,
  users,
  verificationTokens,
} from "@mindkid/db";
import { enforceTwoAxisRateLimit } from "@mindkid/shared";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, type H3Event, readBody } from "h3";
import { z } from "zod";
import {
  assertRateLimitAllowed,
  assertRequestBodySize,
  assertSameOriginRequest,
  getVerifiedRemoteIp,
} from "#server/utils/auth-runtime";

const EmailSchema = z
  .object({ email: z.string().trim().email().max(255) })
  .strict();

export async function handleForgotPassword(event: H3Event, testBody?: unknown) {
  assertSameOriginRequest(event);
  assertRequestBodySize(event, 16 * 1024);
  const ipRateLimit = await enforceTwoAxisRateLimit({
    routeClass: "auth:forgot-password",
    remoteIp: getVerifiedRemoteIp(event),
  });
  assertRateLimitAllowed(ipRateLimit.statusCode);

  const rawBody =
    testBody ??
    event.context?.body ??
    (await readBody(event).catch(() => null));
  const parsed = EmailSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw appError("VALIDATION_FAILED");
  }
  const email = parsed.data.email.toLowerCase();

  // BR-PWR-04: Rate limit forgot password
  const rateLimitRes = await enforceTwoAxisRateLimit({
    routeClass: "auth:forgot-password",
    remoteIp: getVerifiedRemoteIp(event),
    accountIdentifier: email,
  });

  assertRateLimitAllowed(rateLimitRes.statusCode);

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
        eq(verificationTokens.accountType, "user"),
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
}

export default defineEventHandler((event) => handleForgotPassword(event));
