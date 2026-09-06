import { childProfiles, getOwnerDb } from "@mindkid/db";
import { NoActiveChildError } from "@mindkid/errors/child";
import { allowedTiers } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, deleteCookie, getCookie, getQuery } from "h3";
import { getRecommendationsForChild } from "#server/services/index.js";

import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const candidateUuid = getCookie(event, "active_child_id");

  if (!candidateUuid) {
    throw new NoActiveChildError(
      "Vui lòng chọn hồ sơ trẻ trước khi lấy gợi ý chơi."
    );
  }

  const userId = Number(user.user_id);
  const db = getOwnerDb();

  // 1. Verify child profile ownership and active status (BR-PEN-02)
  const [activeChild] = await db
    .select()
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.uuid, candidateUuid),
        eq(childProfiles.userId, userId),
        eq(childProfiles.status, "active")
      )
    );

  if (!activeChild) {
    deleteCookie(event, "active_child_id", { path: "/" });
    throw new NoActiveChildError(
      "Hồ sơ trẻ không tồn tại hoặc đã bị lưu trữ. Vui lòng chọn lại."
    );
  }

  // 2. Parse query parameters (clamped limit <= 5)
  const query = getQuery(event);
  const rawLimit = Number(query.limit);
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(rawLimit, 5))
    : 5;

  // 3. Resolve user entitlements & allowed tiers in batch
  const activeKeys = await resolveUserActiveEntitlements(userId);
  const userAllowedTiers = await allowedTiers(
    {
      kind: "user",
      user_id: String(userId),
      active_child_id: String(activeChild.id),
    },
    activeKeys
  );

  // 4. Compute 7-tier rule-based recommendations (BR-REC-01..08, D-MQ..D-MV)
  const recommendations = await getRecommendationsForChild(db, {
    childId: Number(activeChild.id),
    allowedTiers: userAllowedTiers,
    limit,
  });

  return recommendations;
});
