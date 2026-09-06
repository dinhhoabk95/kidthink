import { verifyPassword } from "@mindkid/auth";
import { getOwnerDb, users } from "@mindkid/db";
import {
  InvalidCredentialsError,
  PasswordNotSetError,
} from "@mindkid/errors/auth";
import { eq } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";

import {
  assertRequestBodySize,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { markCurrentSessionReauthenticated } from "#server/utils/reauth-runtime";

const ReauthSchema = z
  .object({
    password: z.string().min(1).max(1024),
  })
  .strict();

export default defineEventHandler(async (event) => {
  assertRequestBodySize(event, 8 * 1024);
  const userSession = await requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

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

  if (!account?.passwordHash) {
    throw new PasswordNotSetError();
  }

  const isValid = await verifyPassword(
    parsed.data.password,
    account.passwordHash
  );
  if (!isValid) {
    throw new InvalidCredentialsError();
  }

  const now = new Date();
  await markCurrentSessionReauthenticated(event, now);

  return {
    ok: true,
    reauthenticated_at: now.toISOString(),
  };
});
