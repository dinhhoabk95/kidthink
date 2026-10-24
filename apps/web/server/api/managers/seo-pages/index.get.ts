import { getOwnerDb, seoPages } from "@mindkid/db";
import { desc } from "drizzle-orm";
import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";

const listSeoPagesQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  page_type: z
    .enum(["competency", "skill", "age_program", "topic", "static", "faq", ""])
    .optional(),
  status: z
    .enum([
      "draft",
      "in_review",
      "approved",
      "published",
      "archived",
      "rejected",
      "",
    ])
    .optional(),
});

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);
  const parsed = listSeoPagesQuerySchema.safeParse(getQuery(event));
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const { q, page_type: pageTypeFilter, status: statusFilter } = parsed.data;
  const db = getOwnerDb();

  const rows = await db
    .select()
    .from(seoPages)
    .orderBy(desc(seoPages.updatedAt));

  const keyword = q ? q.toLowerCase() : "";
  const items = rows.filter((row) => {
    if (pageTypeFilter && row.pageType !== pageTypeFilter) {
      return false;
    }
    if (statusFilter && row.status !== statusFilter) {
      return false;
    }
    if (keyword) {
      const hay =
        `${row.slug} ${row.title} ${row.metaDescription}`.toLowerCase();
      if (!hay.includes(keyword)) {
        return false;
      }
    }
    return true;
  });

  return {
    items,
    total: items.length,
  };
});
