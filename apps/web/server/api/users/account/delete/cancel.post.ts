import { AppError, appError, verifyPassword } from "@kidthink/auth";
import { cancelUserDeletion, getOwnerDb, users } from "@kidthink/db";
import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import {
  assertRequestBodySize,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";

const CancelDeletionSchema = z
  .object({
    email: z.string().trim().email().optional(),
    password: z.string().optional(),
  })
  .strict();

async function resolveTargetUserId(
  event: H3Event,
  db: ReturnType<typeof getOwnerDb>
): Promise<number> {
  const sessionUserId = (event.context as { user?: { user_id?: number } })?.user
    ?.user_id;

  if (sessionUserId) {
    return Number(sessionUserId);
  }

  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};
  const parsed = CancelDeletionSchema.safeParse(rawBody);

  if (!(parsed.success && parsed.data.email)) {
    setResponseStatus(event, 401);
    throw createError({
      statusCode: 401,
      statusMessage: "UNAUTHENTICATED",
      data: {
        code: "UNAUTHENTICATED",
        message:
          "Cần đăng nhập hoặc cung cấp thông tin tài khoản để huỷ yêu cầu xoá.",
      },
    });
  }

  const [foundUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1);

  if (!foundUser) {
    setResponseStatus(event, 404);
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  if (parsed.data.password && foundUser.passwordHash) {
    const isValid = await verifyPassword(
      parsed.data.password,
      foundUser.passwordHash
    );
    if (!isValid) {
      throw appError("INVALID_CREDENTIALS");
    }
  }

  return foundUser.id;
}

export default defineEventHandler(async (event) => {
  try {
    assertRequestBodySize(event, 8 * 1024);
    const db = getOwnerDb();
    const targetUserId = await resolveTargetUserId(event, db);

    const [account] = await db
      .select({
        id: users.id,
        status: users.status,
        purgeAt: users.purgeAt,
      })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!account) {
      setResponseStatus(event, 404);
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    if (account.status === "purged") {
      throw appError("ACCOUNT_PURGED");
    }

    const now = new Date();
    if (account.purgeAt && account.purgeAt.getTime() <= now.getTime()) {
      throw appError("ACCOUNT_PURGED");
    }

    // BR-ADL-02: Cancel deletion within 30-day grace period restores active state
    await cancelUserDeletion(db, targetUserId);

    return {
      status: "active",
      message:
        "Đã huỷ yêu cầu xoá tài khoản thành công. Tài khoản của bạn đã được kích hoạt lại.",
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
