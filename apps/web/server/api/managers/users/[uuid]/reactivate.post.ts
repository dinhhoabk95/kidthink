import { writeAudit } from "@mindkid/audit";
import { getOwnerDb, users } from "@mindkid/db";
import {
  AdminNoteRequiredError,
  UserAlreadyDeletedError,
} from "@mindkid/errors/account";
import { InternalError, NotFoundError } from "@mindkid/errors/common";
import { eq } from "drizzle-orm";
import { defineEventHandler, getHeader, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";

const reactivateBodySchema = z.object({
  reason: z.string().min(10),
});

export default defineEventHandler(async (event) => {
  const session = await requireSuperAdminSession(event);
  const userUuid = getRouterParam(event, "uuid");
  if (!userUuid) {
    throw new NotFoundError();
  }

  const rawBody =
    event.context?.body ?? (await readBody(event).catch(() => ({}))) ?? {};
  const parsed = reactivateBodySchema.safeParse(rawBody);

  // BR-USM-03: reason must be >= 10 characters
  if (!parsed.success) {
    throw new AdminNoteRequiredError();
  }
  const reason = parsed.data.reason.trim();

  const db = getOwnerDb();
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.uuid, userUuid))
    .limit(1);

  if (!targetUser) {
    throw new NotFoundError();
  }

  if (targetUser.status === "deleted") {
    throw new UserAlreadyDeletedError();
  }

  const ipAddress = getVerifiedRemoteIp(event);
  const userAgent = getHeader(event, "user-agent") ?? "unknown";

  const updatedUser = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(users)
      .set({
        status: "active",
        suspendedReason: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUser.id))
      .returning();

    if (!row) {
      throw new InternalError("Cập nhật tài khoản thất bại");
    }

    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: session.manager_id,
      action: "user_reactivated",
      entity_type: "user",
      entity_id: targetUser.uuid,
      before_data: { status: targetUser.status },
      after_data: { status: row.status },
      reason,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return row;
  });

  return {
    success: true,
    status: updatedUser.status,
  };
});
