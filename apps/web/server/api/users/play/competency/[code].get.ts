import { getOwnerDb } from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { getRouterParam } from "h3";
import { getChildCompetencyGames } from "#server/services/index.js";
import { requireOwnedActiveChild } from "#server/utils/active-child-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";

/**
 * Khám phá trò chơi theo năng lực cho trẻ — `child-competency-explorer.md`, `BR-CCE-01..08`.
 */
export default defineApiRoute({
  auth: "user",
  async handler({ event, auth }) {
    const code = getRouterParam(event, "code") ?? "";
    const db = getOwnerDb();
    const child = await requireOwnedActiveChild(
      event,
      db,
      Number(auth.user_id)
    );

    const result = await getChildCompetencyGames(
      {
        childId: child.id,
        childUuid: child.uuid,
        childDisplayName: child.displayName,
        birthYear: child.birthYear,
        competencyCode: code,
      },
      db
    );

    if (!result) {
      throw new NotFoundError("Không tìm thấy nhóm năng lực hợp lệ.");
    }

    return result;
  },
});
