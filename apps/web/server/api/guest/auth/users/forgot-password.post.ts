import { generateSecureToken, hashSecureToken } from "@mindkid/auth";
import { getAppDb, users, verificationTokens } from "@mindkid/db";
import { ValidationError } from "@mindkid/errors/common";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import { enforceTwoAxisRateLimit } from "@mindkid/shared";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, type H3Event, readBody } from "h3";
import { z } from "zod";
import { buildAccountActionUrl } from "#server/utils/account-action-url";
import {
  assertRateLimitAllowed,
  getVerifiedRemoteIp,
} from "#server/utils/auth-runtime";

const EmailSchema = z
  .object({ email: z.string().trim().email().max(255) })
  .strict();

export async function handleForgotPassword(event: H3Event, testBody?: unknown) {
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

  const resetUrl = buildAccountActionUrl("password_reset", rawToken);
  await dispatchTransactionalEmail({
    recipientType: "user",
    recipientId: user.id,
    code: "password_reset",
    to: user.email,
    payload: {
      email: user.email,
      displayName: user.displayName,
    },
    secrets: {
      token: rawToken,
      url: resetUrl,
    },
  });

  return { ok: true };
}

export default defineEventHandler((event) => handleForgotPassword(event));
