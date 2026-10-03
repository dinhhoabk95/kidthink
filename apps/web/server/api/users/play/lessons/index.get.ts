import { getOwnerDb } from "@mindkid/db";
import { z } from "zod";
import { listLessonsForChild } from "#server/services/index.js";
import { requireOwnedActiveChild } from "#server/utils/active-child-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";

const MAX_LIMIT = 12;
const DEFAULT_LIMIT = 6;

const QuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, "limit phải là số nguyên từ 1 đến 12.")
    .max(MAX_LIMIT, "limit phải là số nguyên từ 1 đến 12.")
    .default(DEFAULT_LIMIT),
});

/** Bài gợi ý cho sảnh trẻ — `child-lesson-flow.md` §8, `BR-CLF-07`. */
export default defineApiRoute({
  auth: "user",
  query: QuerySchema,
  async handler({ event, auth, query }) {
    const db = getOwnerDb();
    const child = await requireOwnedActiveChild(
      event,
      db,
      Number(auth.user_id)
    );

    return await listLessonsForChild(db, {
      childId: child.id,
      birthYear: child.birthYear,
      limit: query.limit,
    });
  },
});
