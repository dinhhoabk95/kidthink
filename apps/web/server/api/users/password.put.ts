import {
  AppError,
  appError,
  hashPassword,
  validatePasswordStrength,
} from "@kidthink/auth";
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
import { requireReauth } from "../../utils/reauth-runtime.js";

const SetPasswordSchema = z
  .object({
    new_password: z.string().min(8).max(1024),
  })
  .strict();

export default defineEventHandler(async (event) => {
  try {
    assertRequestBodySize(event, 8 * 1024);
    const userSession = await requireWebUserSession(event);
    await requireReauth(event);

    const userId = Number(userSession.user_id);

    const eventBody = (event.context as { body?: Record<string, unknown> })
      ?.body;
    const rawBody =
      eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

    const parsed = SetPasswordSchema.safeParse(rawBody);
    if (!parsed.success) {
      setResponseStatus(event, 422);
      throw createError({
        statusCode: 422,
        statusMessage: "VALIDATION_FAILED",
        data: {
          code: "VALIDATION_FAILED",
          message: "Mật khẩu mới phải có ít nhất 8 ký tự.",
        },
      });
    }

    const passwordValidation = validatePasswordStrength(
      parsed.data.new_password
    );
    if (!passwordValidation.valid) {
      setResponseStatus(event, 422);
      throw createError({
        statusCode: 422,
        statusMessage: "VALIDATION_FAILED",
        data: {
          code: "VALIDATION_FAILED",
          message: passwordValidation.reason || "Mật khẩu không đủ mạnh.",
        },
      });
    }

    const db = getOwnerDb();
    const [account] = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
        refreshTokenVersion: users.refreshTokenVersion,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!account) {
      setResponseStatus(event, 404);
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    // If account already has a password, reject with 409 PASSWORD_ALREADY_SET
    if (account.passwordHash) {
      throw appError("PASSWORD_ALREADY_SET");
    }

    const newHash = await hashPassword(parsed.data.new_password);

    // BR-ACS-10: Initial password setup does NOT increment refreshTokenVersion
    await db
      .update(users)
      .set({
        passwordHash: newHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    setResponseStatus(event, 201);
    return {
      ok: true,
      message: "Thiết lập mật khẩu thành công.",
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
