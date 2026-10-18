import { writeAudit } from "@mindkid/audit";
import { childProfiles, getOwnerDb } from "@mindkid/db";
import { InternalError, NotFoundError } from "@mindkid/errors/common";
import { and, eq } from "drizzle-orm";
import {
  defineEventHandler,
  deleteCookie,
  getCookie,
  getHeader,
  getRouterParam,
} from "h3";

import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  const userId = Number(user.user_id);
  const db = getOwnerDb();

  // Ownership check (BR-CPC-09)
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(and(eq(childProfiles.uuid, uuid), eq(childProfiles.userId, userId)));

  if (!child) {
    throw new NotFoundError("NOT_FOUND");
  }

  // Clear active_child_id cookie if target child is active
  const activeUuid = getCookie(event, "active_child_id");
  if (activeUuid === uuid) {
    deleteCookie(event, "active_child_id", { path: "/" });
  }

  const ipAddress = getVerifiedRemoteIp(event);
  const userAgent = getHeader(event, "user-agent") ?? null;

  // BR-CPR-01 & BR-CPR-02: Archive profile, release quota, keep play data intact
  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(childProfiles)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(eq(childProfiles.id, child.id))
      .returning();

    if (!row) {
      throw new InternalError("ARCHIVE_FAILED");
    }

    await writeAudit(tx, {
      actor_type: "user",
      actor_id: userId,
      action: "child_profile_archived",
      entity_type: "child_profile",
      entity_id: row.uuid,
      before_data: { child_uuid: row.uuid, status: child.status },
      after_data: { child_uuid: row.uuid, status: row.status },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return row;
  });

  return {
    uuid: updated.uuid,
    status: updated.status,
  };
});
