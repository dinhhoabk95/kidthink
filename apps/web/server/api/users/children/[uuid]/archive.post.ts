import { childProfiles, getOwnerDb } from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  deleteCookie,
  getCookie,
  getRouterParam,
  setResponseStatus,
} from "h3";

import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    setResponseStatus(event, 404);
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const userId = Number(user.user_id);
  const db = getOwnerDb();

  // Ownership check (BR-CPC-09)
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(and(eq(childProfiles.uuid, uuid), eq(childProfiles.userId, userId)));

  if (!child) {
    setResponseStatus(event, 404);
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
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
    throw createError({ statusCode: 500, statusMessage: "ARCHIVE_FAILED" });
  }

  return {
    uuid: updated.uuid,
    status: updated.status,
  };
});
