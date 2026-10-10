import { getOwnerDb } from "@mindkid/db";
import { getChildThemeMap } from "#server/services/index.js";
import { requireOwnedActiveChild } from "#server/utils/active-child-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";

/**
 * Bản đồ chủ đề tuần cho trẻ tự học — `child-theme-map.md`, `BR-WTM-01..08`.
 */
export default defineApiRoute({
  auth: "user",
  async handler({ event, auth }) {
    const db = getOwnerDb();
    const child = await requireOwnedActiveChild(
      event,
      db,
      Number(auth.user_id)
    );

    return await getChildThemeMap(db, {
      childId: child.id,
      childUuid: child.uuid,
      displayName: child.displayName,
      birthYear: child.birthYear,
    });
  },
});
