import { verifyPassword } from "@mindkid/auth";
import { cancelUserDeletion, getOwnerDb, users } from "@mindkid/db";
import { AccountPurgedError } from "@mindkid/errors/account";
import {
  InvalidCredentialsError,
  UnauthenticatedError,
} from "@mindkid/errors/auth";
import { NotFoundError } from "@mindkid/errors/common";
import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";

import { assertRequestBodySize } from "#server/utils/auth-runtime";

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
    throw new UnauthenticatedError(
      "Cần đăng nhập hoặc cung cấp thông tin tài khoản để huỷ yêu cầu xoá."
    );
  }

  const [foundUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1);

  if (!foundUser) {
    throw new NotFoundError("NOT_FOUND");
  }

  if (parsed.data.password && foundUser.passwordHash) {
    const isValid = await verifyPassword(
      parsed.data.password,
      foundUser.passwordHash
    );
    if (!isValid) {
      throw new InvalidCredentialsError();
    }
  }

  return foundUser.id;
}

export default defineEventHandler(async (event) => {
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
    throw new NotFoundError("NOT_FOUND");
  }

  const now = new Date();
  if (account.purgeAt && account.purgeAt.getTime() <= now.getTime()) {
    throw new AccountPurgedError();
  }

  // BR-ADL-02: Cancel deletion within 30-day grace period restores active state
  await cancelUserDeletion(db, targetUserId);

  return {
    status: "active",
    message:
      "Đã huỷ yêu cầu xoá tài khoản thành công. Tài khoản của bạn đã được kích hoạt lại.",
  };
});
