import { verifyPassword } from "@mindkid/auth";
import { childProfiles, getOwnerDb, users } from "@mindkid/db";
import { InvalidCredentialsError } from "@mindkid/errors/auth";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { and, eq } from "drizzle-orm";
import {
  defineEventHandler,
  deleteCookie,
  getCookie,
  getRouterParam,
  readBody,
} from "h3";
import { z } from "zod";
import {
  assertRequestBodySize,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

const deleteChildSchema = z.object({
  password: z.string().optional().default(""),
  confirm_name: z.string().optional().default(""),
});

export default defineEventHandler(async (event) => {
  assertRequestBodySize(event, 16 * 1024);
  const userSession = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  const userId = Number(userSession.user_id);
  const db = getOwnerDb();

  // Verify ownership at DB level (BR-CPC-09)
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(and(eq(childProfiles.uuid, uuid), eq(childProfiles.userId, userId)));

  if (!child) {
    throw new NotFoundError("NOT_FOUND");
  }

  const eventBody = (event.context as { body?: unknown })?.body;
  const raw = eventBody || (await readBody(event).catch(() => ({})));
  const parsed = deleteChildSchema.parse(raw);

  const password = parsed.password;
  const confirmName = parsed.confirm_name.trim();

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
    throw new InvalidCredentialsError("Mật khẩu xác nhận không đúng.");
  }

  // BR-CPR-04: Confirmation requires typing exact child display_name
  if (confirmName !== child.displayName) {
    throw new ValidationError(
      "Tên xác nhận không trùng khớp với tên hồ sơ trẻ."
    );
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
