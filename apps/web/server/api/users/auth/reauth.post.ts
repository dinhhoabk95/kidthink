import {
  decryptTotpSecret,
  getAuthRedisClient,
  MfaAttemptGuard,
  verifyPassword,
  verifyTotpCode,
} from "@mindkid/auth";
import { getOwnerDb, mfaSettings, socialIdentities, users } from "@mindkid/db";
import {
  InvalidCredentialsError,
  MfaLockedError,
  PasswordNotSetError,
} from "@mindkid/errors/auth";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, type H3Event, readBody } from "h3";
import { z } from "zod";
import { getMfaEncryptionKey } from "#server/utils/admin-auth-runtime";
import {
  enforceTwoAxisRateLimit,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import {
  clearOAuthTicketCookie,
  readOAuthTicketProfile,
} from "#server/utils/oauth-ticket";
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

type ReauthPayload = z.infer<typeof ReauthSchema>;

async function verifyUserTotpReauth(
  db: ReturnType<typeof getOwnerDb>,
  userId: number,
  totpCode: string
): Promise<void> {
  const attemptGuard = new MfaAttemptGuard(getAuthRedisClient());
  await attemptGuard.assertNotLocked("user", userId);
  const [mfa] = await db
    .select()
    .from(mfaSettings)
    .where(
      and(
        eq(mfaSettings.accountType, "user"),
        eq(mfaSettings.accountId, userId)
      )
    )
    .limit(1);

  if (!(mfa?.confirmedAt && mfa.secretEncrypted)) {
    throw new InvalidCredentialsError();
  }
  const secret = decryptTotpSecret(mfa.secretEncrypted, getMfaEncryptionKey());
  if (!verifyTotpCode(totpCode, secret)) {
    const failure = await attemptGuard.recordFailure("user", userId);
    if (failure.locked) {
      throw new MfaLockedError();
    }
    throw new InvalidCredentialsError();
  }
  await attemptGuard.reset("user", userId);
}

async function verifyUserSocialReauth(
  event: H3Event,
  db: ReturnType<typeof getOwnerDb>,
  userId: number,
  sessionEmail: string | undefined,
  passwordHash: string | null,
  provider?: "google" | "facebook"
): Promise<void> {
  if (passwordHash) {
    throw new InvalidCredentialsError();
  }
  const ticketProfile = readOAuthTicketProfile(event);
  clearOAuthTicketCookie(event);
  const ticketEmail = ticketProfile?.email_at_provider;
  if (
    !(ticketProfile && sessionEmail && ticketEmail) ||
    ticketEmail.toLowerCase() !== sessionEmail.toLowerCase() ||
    (provider && ticketProfile.provider !== provider)
  ) {
    throw new InvalidCredentialsError();
  }
  const [linked] = await db
    .select({ id: socialIdentities.id })
    .from(socialIdentities)
    .where(
      and(
        eq(socialIdentities.userId, userId),
        eq(socialIdentities.provider, ticketProfile.provider),
        eq(socialIdentities.providerUserId, ticketProfile.provider_user_id)
      )
    )
    .limit(1);
  if (!linked) {
    throw new InvalidCredentialsError();
  }
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

async function performUserReauthVerification(
  event: H3Event,
  db: ReturnType<typeof getOwnerDb>,
  userId: number,
  sessionEmail: string | undefined,
  passwordHash: string | null,
  data: ReauthPayload
): Promise<void> {
  const totpCode = data.totp ?? data.code;
  if (totpCode) {
    await verifyUserTotpReauth(db, userId, totpCode);
    return;
  }
  if (data.method === "social" || data.provider) {
    const [mfa] = await db
      .select({ confirmedAt: mfaSettings.confirmedAt })
      .from(mfaSettings)
      .where(
        and(
          eq(mfaSettings.accountType, "user"),
          eq(mfaSettings.accountId, userId)
        )
      )
      .limit(1);
    if (mfa?.confirmedAt != null) {
      throw new InvalidCredentialsError();
    }
    await verifyUserSocialReauth(
      event,
      db,
      userId,
      sessionEmail,
      passwordHash,
      data.provider
    );
    return;
  }
  await verifyUserPasswordReauth(data.password, passwordHash);
}

export default defineEventHandler(async (event) => {
  const userSession = await requireWebUserSession(event);
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
    .select({ email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!account) {
    throw new InvalidCredentialsError();
  }

  await performUserReauthVerification(
    event,
    db,
    userId,
    account.email,
    account.passwordHash,
    parsed.data
  );

  const now = new Date();
  await markCurrentSessionReauthenticated(event, now);

  return {
    ok: true,
    reauthenticated_at: now.toISOString(),
  };
});
