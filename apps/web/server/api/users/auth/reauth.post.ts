import {
  getAuthRedisClient,
  MfaAttemptGuard,
  verifyBetterAuthTotp,
  verifyPassword,
} from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import { getOwnerDb, userAccounts, users, userTwoFactors } from "@mindkid/db";
import {
  InvalidCredentialsError,
  MfaLockedError,
  PasswordNotSetError,
} from "@mindkid/errors/auth";
import { and, eq, ne } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import {
  enforceTwoAxisRateLimit,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { markCurrentSessionReauthenticated } from "#server/utils/reauth-runtime";

const ReauthSchema = z
  .object({
    password: z.string().min(1).max(1024).optional(),
    totp: z.string().length(6).optional(),
    code: z.string().length(6).optional(),
    method: z.enum(["password", "totp", "social"]).optional(),
    provider: z.enum(["google", "facebook"]).optional(),
  })
  .strict();

async function verifyUserTotpReauth(
  db: ReturnType<typeof getOwnerDb>,
  userId: number,
  totpCode: string
): Promise<void> {
  const attemptGuard = new MfaAttemptGuard(getAuthRedisClient());
  await attemptGuard.assertNotLocked("user", userId);
  const [mfa] = await db
    .select()
    .from(userTwoFactors)
    .where(eq(userTwoFactors.userId, userId))
    .limit(1);

  if (!mfa?.secret) {
    throw new InvalidCredentialsError();
  }
  const ok = await verifyBetterAuthTotp({
    storedSecret: mfa.secret,
    rootSecret: requireEnv("NUXT_SESSION_PASSWORD"),
    namespace: "user",
    code: totpCode,
  });
  if (!ok) {
    const failure = await attemptGuard.recordFailure("user", userId);
    if (failure.locked) {
      throw new MfaLockedError();
    }
    throw new InvalidCredentialsError();
  }
  await attemptGuard.reset("user", userId);
}

async function verifyUserPasswordReauth(
  password: string | undefined,
  passwordHash: string | null
): Promise<void> {
  if (!password) {
    throw new InvalidCredentialsError();
  }
  if (!passwordHash) {
    throw new PasswordNotSetError();
  }
  const isValid = await verifyPassword(password, passwordHash);
  if (!isValid) {
    throw new InvalidCredentialsError();
  }
}

async function verifyUserSocialReauth(
  db: ReturnType<typeof getOwnerDb>,
  userId: number,
  provider?: "google" | "facebook"
): Promise<void> {
  const whereClause = provider
    ? and(
        eq(userAccounts.userId, userId),
        eq(userAccounts.providerId, provider)
      )
    : and(
        eq(userAccounts.userId, userId),
        ne(userAccounts.providerId, "credential")
      );
  const [linked] = await db
    .select({ id: userAccounts.id })
    .from(userAccounts)
    .where(whereClause)
    .limit(1);

  if (!linked) {
    throw new InvalidCredentialsError();
  }
}

export default defineEventHandler(async (event) => {
  const userSession = requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  await enforceTwoAxisRateLimit(event, "auth:reauth", String(userId));

  const eventBody = (event.context as { body?: Record<string, string> })?.body;
  const rawBody =
    eventBody || (await readBody<Record<string, string>>(event)) || {};

  const parsed = ReauthSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new InvalidCredentialsError();
  }

  const db = getOwnerDb();
  const [account] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!account) {
    throw new InvalidCredentialsError();
  }

  const [cred] = await db
    .select({ password: userAccounts.password })
    .from(userAccounts)
    .where(
      and(
        eq(userAccounts.userId, userId),
        eq(userAccounts.providerId, "credential")
      )
    )
    .limit(1);

  const effectiveHash = cred?.password ?? account.passwordHash;
  const totpCode = parsed.data.totp ?? parsed.data.code;

  if (parsed.data.method === "social") {
    await verifyUserSocialReauth(db, userId, parsed.data.provider);
  } else if (totpCode) {
    await verifyUserTotpReauth(db, userId, totpCode);
  } else {
    await verifyUserPasswordReauth(parsed.data.password, effectiveHash);
  }

  const now = new Date();
  await markCurrentSessionReauthenticated(event, now);

  return {
    ok: true,
    reauthenticated_at: now.toISOString(),
  };
});
