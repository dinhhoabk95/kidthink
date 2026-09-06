import { verifyPassword } from "@mindkid/auth";
import { getOwnerDb, managers } from "@mindkid/db";
import { InvalidCredentialsError } from "@mindkid/errors/auth";
import { eq } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import {
  assertManagerRequestBodySize,
  requireManagerSession,
} from "#server/utils/admin-auth-runtime";

import { markCurrentSessionReauthenticated } from "#server/utils/reauth-runtime";

const ReauthSchema = z
  .object({
    password: z.string().min(1).max(1024),
  })
  .strict();

export default defineEventHandler(async (event) => {
  assertManagerRequestBodySize(event, 8 * 1024);
  const managerSession = requireManagerSession(event);
  const managerId = Number(managerSession.manager_id);

  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

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

  if (!(manager?.isActive && manager.passwordHash)) {
    throw new InvalidCredentialsError();
  }

  const isValid = await verifyPassword(
    parsed.data.password,
    manager.passwordHash
  );
  if (!isValid) {
    throw new InvalidCredentialsError();
  }

  const now = new Date();
  markCurrentSessionReauthenticated(event, now);

  return {
    ok: true,
    reauthenticated_at: now.toISOString(),
  };
});
