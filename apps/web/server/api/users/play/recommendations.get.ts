import { NoActiveChildError } from "@mindkid/errors/child";
import { deleteCookie, getCookie } from "h3";
import { z } from "zod";
import { getChildPlayRecommendationsExperience } from "#server/services/play-experience-service";
import { defineApiRoute } from "#server/utils/define-api-route";

const UserRecommendationsQuerySchema = z.object({
  limit: z.coerce.number().optional(),
});

export default defineApiRoute({
  auth: "user",
  query: UserRecommendationsQuerySchema,
  async handler({ event, auth, query }) {
    const candidateUuid = getCookie(event, "active_child_id");
    const rawLimit = Number(query.limit ?? Number.NaN);
    const limit = Number.isFinite(rawLimit)
      ? Math.max(1, Math.min(rawLimit, 5))
      : 5;

    try {
      return await getChildPlayRecommendationsExperience(
        Number(auth.user_id),
        candidateUuid,
        limit
      );
    } catch (err) {
      if (err instanceof NoActiveChildError && candidateUuid) {
        deleteCookie(event, "active_child_id", { path: "/" });
      }
      throw err;
    }
  },
});
