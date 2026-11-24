import { NoActiveChildError } from "@mindkid/errors/child";
import { deleteCookie, getCookie } from "h3";
import { getChildPlayMapExperience } from "#server/services/play-experience-service";
import { defineApiRoute } from "#server/utils/define-api-route";

/**
 * BR-PRG-02, BR-PRG-03, BR-PRG-04, BR-PRG-05, D-MJ, D-MK & spec §7.1
 * Child Progress Map:
 * - Reads best_p_learn to guarantee strictly monotonic visual status (never regresses).
 * - Forbids raw p_learn, percentages, numeric scoreboards, and cross-child ranking.
 * - Displays 1-2 active learning regions for preschool age group.
 */
export default defineApiRoute({
  auth: "user",
  async handler({ event, auth }) {
    const candidateUuid = getCookie(event, "active_child_id");
    try {
      return await getChildPlayMapExperience(
        Number(auth.user_id),
        candidateUuid
      );
    } catch (err) {
      if (err instanceof NoActiveChildError && candidateUuid) {
        deleteCookie(event, "active_child_id", { path: "/" });
      }
      throw err;
    }
  },
});
