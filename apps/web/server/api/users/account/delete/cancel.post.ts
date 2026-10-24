import { verifyPassword } from "@mindkid/auth";
import { cancelUserDeletion, getOwnerDb, users } from "@mindkid/db";
import {
  AccountPurgedError,
  AccountSuspendedError,
} from "@mindkid/errors/account";
import {
  InvalidCredentialsError,
  UnauthenticatedError,
} from "@mindkid/errors/auth";
import { NotFoundError } from "@mindkid/errors/common";
import { InvalidStatusTransitionError } from "@mindkid/errors/content";
import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { defineEventHandler, readBody } from "h3";
import { z } from "zod";

const DUMMY_HASH =
  "$argon2id$v=19$m=19456,p=1,t=2$Zmx0piJSIcdd2b8oaF8ZUg$U60ArJk0sNteiIdlfZyr7G0shEXA+IqCyWIKs1La4WE";

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
    const { validateUserCsrf } = await import("#server/utils/auth-runtime");
    validateUserCsrf(event);
    return Number(sessionUserId);
  }

  const eventBody = (event.context as { body?: Record<string, string> })?.body;
  const rawBody =
    eventBody || (await readBody<Record<string, string>>(event)) || {};
  const parsed = CancelDeletionSchema.safeParse(rawBody);

  if (!(parsed.success && parsed.data.email)) {
    throw new UnauthenticatedError(
      "Cần đăng nhập hoặc cung cấp thông tin tài khoản để huỷ yêu cầu xoá."
    );
  }

  if (!parsed.data.password) {
    throw new InvalidCredentialsError();
  }

  const [foundUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1);

  // UC-027 BR-003: không phiên thì bắt buộc xác minh bằng mật khẩu. Thiếu mật
  // khẩu hoặc tài khoản không có mật khẩu đều bị từ chối, không đổi gì.
  if (!foundUser?.passwordHash) {
    await verifyPassword(parsed.data.password, DUMMY_HASH).catch(() => false);
    throw new InvalidCredentialsError();
  }

  const isValid = await verifyPassword(
    parsed.data.password,
    foundUser.passwordHash
  );
  if (!isValid) {
    throw new InvalidCredentialsError();
  }

  return foundUser.id;
}

export default defineEventHandler(async (event) => {
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

  if (account.status === "suspended") {
    throw new AccountSuspendedError();
  }

  if (account.status !== "deleted") {
    throw new InvalidStatusTransitionError(
      "Tài khoản không ở trạng thái chờ xoá."
    );
  }

  const now = new Date();
  if (!account.purgeAt || account.purgeAt.getTime() <= now.getTime()) {
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
