import { NoActiveChildError } from "@mindkid/errors/child";
import { deleteCookie, getCookie, getRouterParam } from "h3";
import { z } from "zod";
import { getChildCompetencyExplorerExperience } from "#server/services/play-experience-service";
import { throwValidationError } from "#server/utils/api-error";
import { defineApiRoute } from "#server/utils/define-api-route";

const CodeParamSchema = z.string().trim().min(1);

/**
 * Khám phá trò chơi theo năng lực cho trẻ — `child-competency-explorer.md`, `BR-CCE-01..08`.
 */
export default defineApiRoute({
  auth: "user",
  async handler({ event, auth }) {
    const parsedCode = CodeParamSchema.safeParse(getRouterParam(event, "code"));
    if (!parsedCode.success) {
      throwValidationError(parsedCode.error);
    }

    const candidateUuid = getCookie(event, "active_child_id");
    try {
      return await getChildCompetencyExplorerExperience(
        Number(auth.user_id),
        candidateUuid,
        parsedCode.data
      );
    } catch (err) {
      if (err instanceof NoActiveChildError && candidateUuid) {
        deleteCookie(event, "active_child_id", { path: "/" });
      }
      throw err;
    }
  },
});
