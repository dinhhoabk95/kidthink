import { AppError } from "@kidthink/auth";
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
} from "../../utils/auth-runtime.js";

const ProfileUpdateSchema = z
  .object({
    display_name: z.string().trim().min(1).max(60),
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

    const parsed = ProfileUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      setResponseStatus(event, 422);
      throw createError({
        statusCode: 422,
        statusMessage: "VALIDATION_FAILED",
        data: {
          code: "VALIDATION_FAILED",
          message: "Tên hiển thị không hợp lệ (1–60 ký tự).",
        },
      });
    }

    const db = getOwnerDb();
    const [updated] = await db
      .update(users)
      .set({
        displayName: parsed.data.display_name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      setResponseStatus(event, 404);
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    return {
      display_name: updated.displayName,
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
