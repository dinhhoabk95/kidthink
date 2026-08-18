import { getOwnerDb, seoPages } from "@mindkid/db";
import { and, desc, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "../../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);
  const slug = getRouterParam(event, "slug");
  const versionParam = getRouterParam(event, "version");

  if (!(slug && versionParam)) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const db = getOwnerDb();
  let row: typeof seoPages.$inferSelect | undefined;

  if (versionParam === "latest") {
    const [found] = await db
      .select()
      .from(seoPages)
      .where(eq(seoPages.slug, slug))
      .orderBy(desc(seoPages.contentVersion))
      .limit(1);
    row = found;
  } else {
    const version = Number(versionParam);
    const [found] = await db
      .select()
      .from(seoPages)
      .where(
        and(eq(seoPages.slug, slug), eq(seoPages.contentVersion, version))
      );
    row = found;
  }

  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: "SEO_PAGE_NOT_FOUND",
      message: `SEO page '${slug}' version '${versionParam}' not found`,
    });
  }

  return row;
});
