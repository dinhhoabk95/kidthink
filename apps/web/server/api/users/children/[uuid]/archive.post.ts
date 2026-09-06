import { childProfiles, getOwnerDb } from "@mindkid/db";
import { InternalError, NotFoundError } from "@mindkid/errors/common";
import { and, eq } from "drizzle-orm";
import {
  defineEventHandler,
  deleteCookie,
  getCookie,
  getRouterParam,
} from "h3";

import { requireWebUserSession } from "#server/utils/auth-runtime";

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

  // BR-CPR-01 & BR-CPR-02: Archive profile, release quota, keep play data intact
  const [updated] = await db
    .update(childProfiles)
    .set({
      status: "archived",
      updatedAt: new Date(),
    })
    .where(eq(childProfiles.id, child.id))
    .returning();

  if (!updated) {
    throw new InternalError("ARCHIVE_FAILED");
  }

  return {
    uuid: updated.uuid,
    status: updated.status,
  };
});
