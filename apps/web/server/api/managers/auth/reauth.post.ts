import {
  decryptTotpSecret,
  getAuthRedisClient,
  MfaAttemptGuard,
  verifyPassword,
  verifyTotpCode,
} from "@mindkid/auth";
import { getOwnerDb, managers, mfaSettings } from "@mindkid/db";
import { InvalidCredentialsError, MfaLockedError } from "@mindkid/errors/auth";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import {
  enforceTwoAxisRateLimit,
  getMfaEncryptionKey,
  requireManagerSession,
} from "#server/utils/admin-auth-runtime";

import { markCurrentSessionReauthenticated } from "#server/utils/reauth-runtime";

const ReauthSchema = z
  .object({
    password: z.string().min(1).max(1024).optional(),
    totp: z.string().length(6).optional(),
    code: z.string().length(6).optional(),
  })
  .strict();

async function verifyManagerTotpReauth(
  db: ReturnType<typeof getOwnerDb>,
  managerId: number,
  totpCode: string
): Promise<void> {
  const attemptGuard = new MfaAttemptGuard(getAuthRedisClient());
  await attemptGuard.assertNotLocked("manager", managerId);
  const [mfa] = await db
    .select()
    .from(mfaSettings)
    .where(
      and(
        eq(mfaSettings.accountType, "manager"),
        eq(mfaSettings.accountId, managerId)
      )
    )
    .limit(1);

  if (!(mfa?.confirmedAt && mfa.secretEncrypted)) {
    throw new InvalidCredentialsError();
  }
  const secret = decryptTotpSecret(mfa.secretEncrypted, getMfaEncryptionKey());
  if (!verifyTotpCode(totpCode, secret)) {
    const failure = await attemptGuard.recordFailure("manager", managerId);
    if (failure.locked) {
      throw new MfaLockedError();
    }
    throw new InvalidCredentialsError();
  }
  await attemptGuard.reset("manager", managerId);
}

async function verifyManagerPasswordReauth(
  password: string | undefined,
  passwordHash: string | null
): Promise<void> {
  if (!(password && passwordHash)) {
    throw new InvalidCredentialsError();
  }
  const isValid = await verifyPassword(password, passwordHash);
  if (!isValid) {
    throw new InvalidCredentialsError();
  }
}

export default defineEventHandler(async (event) => {
  const managerSession = requireManagerSession(event);
  const managerId = Number(managerSession.manager_id);

  await enforceTwoAxisRateLimit(event, "auth:reauth", String(managerId));

  const eventBody = (event.context as { body?: Record<string, string> })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as Record<string, string>) || {};

  const parsed = ReauthSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new InvalidCredentialsError();
  }

  const db = getOwnerDb();
  const [manager] = await db
    .select({
      passwordHash: managers.passwordHash,
      isActive: managers.isActive,
    })
    .from(managers)
    .where(eq(managers.id, managerId))
    .limit(1);

  if (!manager?.isActive) {
    throw new InvalidCredentialsError();
  }

  const totpCode = parsed.data.totp ?? parsed.data.code;
  if (totpCode) {
    await verifyManagerTotpReauth(db, managerId, totpCode);
  } else {
    await verifyManagerPasswordReauth(
      parsed.data.password,
      manager.passwordHash
    );
  }

  const now = new Date();
  await markCurrentSessionReauthenticated(event, now);

  return {
    ok: true,
    reauthenticated_at: now.toISOString(),
  };
});
