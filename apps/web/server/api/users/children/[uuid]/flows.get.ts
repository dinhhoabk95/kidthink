import { childProfiles, getOwnerDb } from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { and, eq } from "drizzle-orm";
import { getRouterParam } from "h3";
import { z } from "zod";
import { listFlowsForChild } from "#server/services/child-lesson-flow";
import { defineApiRoute } from "#server/utils/define-api-route";

const ParamsSchema = z.object({
  uuid: z.string().uuid(),
});

/**
 * Danh sách lesson flows ghi danh được cho trẻ kèm `fits_age`, `age_gap`,
 * `recommend_score` — `docs/specs/05-content/lesson-flow-model.md` §8 (`BR-LFM-02..09`).
 */
export default defineApiRoute({
  auth: "user",
  handler: async ({ event, auth: user }) => {
    const parsedParams = ParamsSchema.safeParse({
      uuid: getRouterParam(event, "uuid"),
    });
    if (!parsedParams.success) {
      throw new NotFoundError("Không tìm thấy hồ sơ trẻ.");
    }

    const userId = Number(user.user_id);
    const db = getOwnerDb();

    const [child] = await db
      .select()
      .from(childProfiles)
      .where(
        and(
          eq(childProfiles.uuid, parsedParams.data.uuid),
          eq(childProfiles.userId, userId),
          eq(childProfiles.status, "active")
        )
      )
      .limit(1);

    if (!child) {
      throw new NotFoundError("Không tìm thấy hồ sơ trẻ.");
    }

    const flows = await listFlowsForChild(db, {
      birthYear: child.birthYear,
    });

    return { flows };
  },
});
