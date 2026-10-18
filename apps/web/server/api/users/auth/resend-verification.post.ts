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

export async function handleResendVerification(
  event: H3Event,
  testBody?: Record<string, string | number | boolean | null | undefined> | null
) {
  const ipRateLimit = await enforceTwoAxisRateLimit({
    routeClass: "auth:forgot-password",
    remoteIp: getVerifiedRemoteIp(event),
  });
  assertRateLimitAllowed(ipRateLimit.statusCode);

  const rawBody =
    testBody ??
    event.context?.body ??
    (await readBody(event).catch(() => null));

  const db = getAppDb();
  let email = "";

  const hasEmailField =
    rawBody !== null &&
    typeof rawBody === "object" &&
    "email" in rawBody &&
    rawBody.email !== undefined &&
    rawBody.email !== "";

  if (hasEmailField || !event.context?.user?.user_id) {
    const parsed = EmailSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ValidationError();
    }
    email = parsed.data.email.toLowerCase();
  } else {
    const [sessionUser] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, event.context.user.user_id));
    if (!sessionUser) {
      return { ok: true };
    }
    email = sessionUser.email.toLowerCase();
  }

  // BR-EVF-07: Rate limit resend
  const rateLimitRes = await enforceTwoAxisRateLimit({
    routeClass: "auth:forgot-password",
    remoteIp: getVerifiedRemoteIp(event),
    accountIdentifier: email,
  });

  assertRateLimitAllowed(rateLimitRes.statusCode);

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

  const actionUrl = buildAccountActionUrl("email_verify", rawToken);

  await dispatchTransactionalEmail({
    recipientType: "user",
    recipientId: user.id,
    code: "email_verification",
    to: user.email,
    payload: {
      email: user.email,
      displayName: user.displayName,
    },
    secrets: {
      token: rawToken,
      url: actionUrl,
    },
  });

  return { ok: true };
}

export default defineEventHandler((event) => handleResendVerification(event));
