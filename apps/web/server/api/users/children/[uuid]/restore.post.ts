import { childProfiles, entitlements, getOwnerDb } from "@mindkid/db";
import { ChildLimitExceededError } from "@mindkid/errors/billing";
import { InternalError, NotFoundError } from "@mindkid/errors/common";
import { and, count, eq, gt, isNull, or } from "drizzle-orm";
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

  // BR-CPR-02: Quota check on restore
  let maxAllowedChildren = 1;
  const activeEntitlements = await db
    .select({ key: entitlements.entitlementKey })
    .from(entitlements)
    .where(
      and(
        eq(entitlements.userId, userId),
        eq(entitlements.status, "active"),
        or(
          isNull(entitlements.expiresAt),
          gt(entitlements.expiresAt, new Date())
        )
      )
    );
  const keys = new Set(activeEntitlements.map((row) => row.key));
  if (keys.has("play_premium_games")) {
    maxAllowedChildren = 5;
  } else if (keys.has("play_standard_games")) {
    maxAllowedChildren = 3;
  }

  const [activeChildRow] = await db
    .select({ value: count() })
    .from(childProfiles)
    .where(
      and(eq(childProfiles.userId, userId), eq(childProfiles.status, "active"))
    );
  const activeChildCount = activeChildRow?.value ?? 0;

  if (activeChildCount >= maxAllowedChildren) {
    throw new ChildLimitExceededError(
      `Không thể khôi phục. Gói dịch vụ đã đạt hạn mức tối đa ${maxAllowedChildren} hồ sơ trẻ đang hoạt động.`
    );
  }

  const [updated] = await db
    .update(childProfiles)
    .set({
      status: "active",
      purgeAt: null,
      updatedAt: new Date(),
    })
    .where(eq(childProfiles.id, child.id))
    .returning();

  if (!updated) {
    throw new InternalError("RESTORE_FAILED");
  }

  return {
    uuid: updated.uuid,
    status: updated.status,
  };
});
