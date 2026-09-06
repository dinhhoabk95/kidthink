import { generateSecureToken, hashSecureToken } from "@mindkid/auth";
import {
  getAppDb,
  notificationDeliveries,
  notifications,
  users,
  verificationTokens,
} from "@mindkid/db";
import { ValidationError } from "@mindkid/errors/common";
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

export async function handleResendVerification(
  event: H3Event,
  testBody?: unknown
) {
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
    throw new ValidationError();
  }
  const email = parsed.data.email.toLowerCase();

  // BR-EVF-07: Rate limit resend
  const rateLimitRes = await enforceTwoAxisRateLimit({
    routeClass: "auth:forgot-password",
    remoteIp: getVerifiedRemoteIp(event),
    accountIdentifier: email,
  });

  assertRateLimitAllowed(rateLimitRes.statusCode);

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
        eq(verificationTokens.accountType, "user"),
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
  const [createdNotification] = await db
    .insert(notifications)
    .values({
      recipientType: "user",
      recipientId: user.id,
      templateCode: "email_verification",
      payload: {
        token: rawToken,
        email: user.email,
        displayName: user.displayName,
      },
    })
    .returning();

  if (createdNotification) {
    await db.insert(notificationDeliveries).values({
      notificationId: createdNotification.id,
      channel: "email",
      status: "queued",
    });
  }

  return { ok: true };
}

export default defineEventHandler((event) => handleResendVerification(event));
