import { AppError, appError, verifyPassword } from "@kidthink/auth";
import { getOwnerDb, managers } from "@kidthink/db";
import { eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import {
  assertManagerRequestBodySize,
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../utils/admin-auth-runtime.js";
import { markCurrentSessionReauthenticated } from "../../../utils/reauth-runtime.js";

const ReauthSchema = z
  .object({
    password: z.string().min(1).max(1024),
  })
  .strict();

export default defineEventHandler(async (event) => {
  try {
    assertManagerRequestBodySize(event, 8 * 1024);
    const managerSession = requireManagerSession(event);
    const managerId = Number(managerSession.manager_id);

    const eventBody = (event.context as { body?: Record<string, unknown> })
      ?.body;
    const rawBody =
      eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

    const parsed = ReauthSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw appError("INVALID_CREDENTIALS");
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
      throw appError("INVALID_CREDENTIALS");
    }

    const isValid = await verifyPassword(
      parsed.data.password,
      manager.passwordHash
    );
    if (!isValid) {
      throw appError("INVALID_CREDENTIALS");
    }

    const now = new Date();
    markCurrentSessionReauthenticated(event, now);

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
    return respondToManagerAuthError(event, err);
  }
});
