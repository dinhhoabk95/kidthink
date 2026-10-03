import { getOwnerDb } from "@mindkid/db";
import { LessonNotFoundError } from "@mindkid/errors/content";
import { allowedTiers } from "@mindkid/shared";
import { getRouterParams } from "h3";
import { z } from "zod";
import { openLessonProgress } from "#server/services/index.js";
import { requireOwnedActiveChild } from "#server/utils/active-child-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

const ParamsSchema = z.object({
  code: z.string().regex(/^LES-\d{4}$/),
});

/** Mở hoặc tiếp lượt trẻ tự học một bài — `child-lesson-flow.md` §8. */
export default defineApiRoute({
  auth: "user",
  async handler({ event, auth }) {
    const params = ParamsSchema.safeParse(getRouterParams(event));
    if (!params.success) {
      throw new LessonNotFoundError();
    }
    const { code } = params.data;
    const userId = Number(auth.user_id);
    const db = getOwnerDb();
    const child = await requireOwnedActiveChild(event, db, userId);

    const caller = {
      kind: "user" as const,
      user_id: String(userId),
      active_child_id: child.uuid,
    };
    const activeKeys = await resolveUserActiveEntitlements(userId);

    return await openLessonProgress(db, {
      childId: child.id,
      lessonCode: code,
      caller,
      allowedTiers: await allowedTiers(caller, activeKeys),
    });
  },
});
