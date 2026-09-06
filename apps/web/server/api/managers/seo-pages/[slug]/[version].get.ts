import { getOwnerDb, seoPages } from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { SeoPageNotFoundError } from "@mindkid/errors/content";
import { and, desc, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);
  const slug = getRouterParam(event, "slug");
  const versionParam = getRouterParam(event, "version");

  if (!(slug && versionParam)) {
    throw new NotFoundError("NOT_FOUND");
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
    throw new SeoPageNotFoundError(`SEO page '${slug}`);
  }

  return row;
});
