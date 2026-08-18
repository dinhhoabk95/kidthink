import { verifyPassword } from "@mindkid/auth";
import { childProfiles, getOwnerDb, users } from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  deleteCookie,
  getCookie,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";

import {
  assertRequestBodySize,
  requireWebUserSession,
} from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  assertRequestBodySize(event, 16 * 1024);
  const userSession = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    setResponseStatus(event, 404);
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const userId = Number(userSession.user_id);
  const db = getOwnerDb();

  // Verify ownership at DB level (BR-CPC-09)
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(and(eq(childProfiles.uuid, uuid), eq(childProfiles.userId, userId)));

  if (!child) {
    setResponseStatus(event, 404);
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const body =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

  const password = String(body.password || "");
  const confirmName = String(body.confirm_name || "").trim();

  // BR-CPR-08: Deletion requires password verification
  const [userRecord] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (
    !(
      userRecord?.passwordHash &&
      (await verifyPassword(password, userRecord.passwordHash))
    )
  ) {
    setResponseStatus(event, 401);
    throw createError({
      statusCode: 401,
      statusMessage: "INVALID_CREDENTIALS",
      data: {
        code: "INVALID_CREDENTIALS",
        message: "Mật khẩu xác nhận không đúng.",
      },
    });
  }

  // BR-CPR-04: Confirmation requires typing exact child display_name
  if (confirmName !== child.displayName) {
    setResponseStatus(event, 422);
    throw createError({
      statusCode: 422,
      statusMessage: "CONFIRM_NAME_MISMATCH",
      data: {
        code: "CONFIRM_NAME_MISMATCH",
        message: "Tên xác nhận không trùng khớp với tên hồ sơ trẻ.",
      },
    });
  }

  // Clear active_child_id cookie if target child is active
  const activeUuid = getCookie(event, "active_child_id");
  if (activeUuid === uuid) {
    deleteCookie(event, "active_child_id", { path: "/" });
  }

  const now = new Date();
  const purgeAt = new Date(now.getTime() + 30 * 86_400 * 1000);

  // BR-CPR-03: Mark status as pending_deletion (30-day grace period)
  await db
    .update(childProfiles)
    .set({
      status: "pending_deletion",
      purgeAt,
      updatedAt: now,
    })
    .where(eq(childProfiles.id, child.id));

  return {
    uuid: child.uuid,
    status: "pending_deletion",
    purge_at: purgeAt.toISOString(),
  };
});
