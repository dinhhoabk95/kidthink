import { getOwnerDb } from "@mindkid/db";
import { LessonNotFoundError } from "@mindkid/errors/content";
import { allowedTiers } from "@mindkid/shared";
import { defineEventHandler, getRouterParams } from "h3";
import { z } from "zod";
import { openLessonProgress } from "#server/services/index.js";
import { requireOwnedActiveChild } from "#server/utils/active-child-runtime";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

const ParamsSchema = z.object({
  code: z.string().regex(/^LES-\d{4}$/),
});

/** Mở hoặc tiếp lượt trẻ tự học một bài — `child-lesson-flow.md` §8. */
export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const params = ParamsSchema.safeParse(getRouterParams(event));
  if (!params.success) {
    throw new LessonNotFoundError();
  }
  const { code } = params.data;
  const userId = Number(user.user_id);
  const db = getOwnerDb();
  const child = await requireOwnedActiveChild(event, db, userId);

  const caller = {
    kind: "user" as const,
    user_id: String(userId),
    active_child_id: child.uuid,
  };
  const activeKeys = await resolveUserActiveEntitlements(userId);

  return openLessonProgress(db, {
    childId: child.id,
    lessonCode: code,
    caller,
    allowedTiers: await allowedTiers(caller, activeKeys),
  });
});
