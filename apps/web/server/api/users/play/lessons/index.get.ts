import { getOwnerDb } from "@mindkid/db";
import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { listLessonsForChild } from "#server/services/index.js";
import { requireOwnedActiveChild } from "#server/utils/active-child-runtime";
import { requireWebUserSession } from "#server/utils/auth-runtime";

const MAX_LIMIT = 12;
const DEFAULT_LIMIT = 6;

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

/** Bài gợi ý cho sảnh trẻ — `child-lesson-flow.md` §8, `BR-CLF-07`. */
export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const query = QuerySchema.safeParse(getQuery(event));
  if (!query.success) {
    throw ValidationError.field(
      "limit",
      "limit phải là số nguyên từ 1 đến 12."
    );
  }
  const { limit } = query.data;
  const db = getOwnerDb();
  const child = await requireOwnedActiveChild(event, db, Number(user.user_id));

  return listLessonsForChild(db, {
    childId: child.id,
    birthYear: child.birthYear,
    limit,
  });
});
