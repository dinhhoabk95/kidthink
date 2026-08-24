import { getOwnerDb, seoPages } from "@mindkid/db";
import { desc } from "drizzle-orm";
import { defineEventHandler } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);
  const db = getOwnerDb();

  const rows = await db
    .select()
    .from(seoPages)
    .orderBy(desc(seoPages.updatedAt));

  return {
    items: rows,
    total: rows.length,
  };
});
