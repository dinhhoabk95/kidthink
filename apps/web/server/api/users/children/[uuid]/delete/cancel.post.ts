import { childProfiles, getOwnerDb } from "@mindkid/db";
import { InternalError, NotFoundError } from "@mindkid/errors/common";
import { InvalidStatusTransitionError } from "@mindkid/errors/content";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";

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

  if (child.status !== "pending_deletion") {
    throw new InvalidStatusTransitionError("Hồ sơ không ở trạng thái chờ xoá.");
  }

  // BR-CPR-03: Cancelling deletion within 30 days restores profile to archived
  const [updated] = await db
    .update(childProfiles)
    .set({
      status: "archived",
      purgeAt: null,
      updatedAt: new Date(),
    })
    .where(eq(childProfiles.id, child.id))
    .returning();

  if (!updated) {
    throw new InternalError("CANCEL_FAILED");
  }

  return {
    uuid: updated.uuid,
    status: updated.status,
  };
});
