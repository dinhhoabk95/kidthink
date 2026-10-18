import { getOwnerDb } from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { allowedTiers } from "@mindkid/shared";
import { getRouterParam } from "h3";
import { getChildCompetencyGames } from "#server/services/index.js";
import { requireOwnedActiveChild } from "#server/utils/active-child-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

/**
 * Khám phá trò chơi theo năng lực cho trẻ — `child-competency-explorer.md`, `BR-CCE-01..08`.
 */
export default defineApiRoute({
  auth: "user",
  async handler({ event, auth }) {
    const code = getRouterParam(event, "code") ?? "";
    const userId = Number(auth.user_id);
    const db = getOwnerDb();
    const child = await requireOwnedActiveChild(event, db, userId);

    const caller = {
      kind: "user" as const,
      user_id: String(userId),
      active_child_id: child.uuid,
    };
    const activeKeys = await resolveUserActiveEntitlements(userId);
    const userAllowedTiers = await allowedTiers(caller, activeKeys);

    const result = await getChildCompetencyGames(
      {
        childId: child.id,
        childUuid: child.uuid,
        childDisplayName: child.displayName,
        birthYear: child.birthYear,
        competencyCode: code,
        allowedTiers: userAllowedTiers,
      },
      db
    );

    if (!result) {
      throw new NotFoundError("Không tìm thấy nhóm năng lực hợp lệ.");
    }

    return result;
  },
});
