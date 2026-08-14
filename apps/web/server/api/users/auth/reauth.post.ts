import { AppError, appError, verifyPassword } from "@kidthink/auth";
import { getOwnerDb, users } from "@kidthink/db";
import { eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import {
  assertRequestBodySize,
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";
import { markCurrentSessionReauthenticated } from "../../../utils/reauth-runtime.js";

const ReauthSchema = z
  .object({
    password: z.string().min(1).max(1024),
  })
  .strict();

export default defineEventHandler(async (event) => {
  try {
    assertRequestBodySize(event, 8 * 1024);
    const userSession = await requireWebUserSession(event);
    const userId = Number(userSession.user_id);

    const eventBody = (event.context as { body?: Record<string, unknown> })
      ?.body;
    const rawBody =
      eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

    const parsed = ReauthSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw appError("INVALID_CREDENTIALS");
    }

    const db = getOwnerDb();
    const [account] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!account?.passwordHash) {
      throw appError("PASSWORD_NOT_SET");
    }

    const isValid = await verifyPassword(
      parsed.data.password,
      account.passwordHash
    );
    if (!isValid) {
      throw appError("INVALID_CREDENTIALS");
    }

    const now = new Date();
    await markCurrentSessionReauthenticated(event, now);

    return {
      ok: true,
      reauthenticated_at: now.toISOString(),
    };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: err.toResponse(),
      });
    }
    return respondToUserAuthError(event, err);
  }
});
