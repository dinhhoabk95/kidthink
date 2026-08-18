import { getOwnerDb, seoPages, writeAudit } from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, readBody } from "h3";
import { requireManagerSession } from "../../../utils/admin-auth-runtime.js";

const FORBIDDEN_LEGAL_SLUGS = [
  "terms",
  "privacy",
  "child-privacy",
  "/terms",
  "/privacy",
  "/child-privacy",
];

function sanitizeRichText(html: string | undefined): string | undefined {
  if (!html) {
    return html;
  }
  const lower = html.toLowerCase();
  if (
    lower.includes("<script") ||
    lower.includes("<iframe") ||
    lower.includes("javascript:") ||
    lower.includes("onclick=") ||
    lower.includes("onerror=")
  ) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      message: "Nội dung chứa mã script hoặc HTML không được phép (BR-SEO-02)",
    });
  }
  return html;
}

function validateAndBuildSeoInsert(
  body: Record<string, unknown> | undefined,
  managerId: number
): typeof seoPages.$inferInsert {
  let rawSlug = String(body?.slug || "")
    .trim()
    .toLowerCase();
  if (rawSlug.startsWith("/")) {
    rawSlug = rawSlug.slice(1);
  }

  if (!rawSlug) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      message: "Slug là bắt buộc",
    });
  }

  // BR-SEO-09: Legal documents forbidden in SEO pages
  if (
    FORBIDDEN_LEGAL_SLUGS.includes(rawSlug) ||
    FORBIDDEN_LEGAL_SLUGS.includes(`/${rawSlug}`)
  ) {
    throw createError({
      statusCode: 422,
      statusMessage: "FORBIDDEN_LEGAL_SLUG",
      message:
        "Các trang pháp lý (terms, privacy, child-privacy) được quản lý qua code PR, không được tạo qua SEO Studio (BR-SEO-09)",
    });
  }

  const title = String(body?.title || "").trim();
  const metaDescription = String(body?.meta_description || "").trim();
  const pageType = (body?.page_type ||
    "topic") as (typeof seoPages.$inferInsert)["pageType"];
  const h1 = body?.h1 ? String(body.h1).trim() : title;
  const bodyHtml = sanitizeRichText(body?.body as string | undefined);
  const ogImagePath = body?.og_image_path ? String(body.og_image_path) : null;
  const canonicalUrl = body?.canonical_url ? String(body.canonical_url) : null;
  const noindex = Boolean(body?.noindex);
  const relatedContentRefs =
    (body?.related_content_refs as Array<{ type: string; code: string }>) || [];
  const faqItems = (body?.faq_items as Array<{ q: string; a: string }>) || [];

  if (!(title && metaDescription)) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      message: "Title và meta_description là bắt buộc",
    });
  }

  return {
    slug: rawSlug,
    contentVersion: 1,
    pageType,
    title,
    metaDescription,
    h1,
    body: bodyHtml,
    ogImagePath,
    canonicalUrl,
    noindex,
    relatedContentRefs,
    faqItems,
    accessTier: "free",
    status: "draft",
    createdByManagerId: managerId,
  };
}

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);
  const body =
    (event.context?.body as Record<string, unknown>) ||
    ((event as Record<string, unknown>)._body as Record<string, unknown>) ||
    (await readBody(event).catch(() => ({})));

  const managerId = manager.manager_id || manager.id || 1;
  const insertData = validateAndBuildSeoInsert(body, managerId);
  const rawSlug = insertData.slug;
  const db = getOwnerDb();

  // Check slug collision
  const [existing] = await db
    .select({ id: seoPages.id })
    .from(seoPages)
    .where(and(eq(seoPages.slug, rawSlug), eq(seoPages.contentVersion, 1)));

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "CODE_ALREADY_EXISTS",
      message: `SEO page với slug '${rawSlug}' đã tồn tại`,
    });
  }

  const [created] = await db.insert(seoPages).values(insertData).returning();

  await writeAudit(db, {
    actor_type: "manager",
    actor_id: managerId,
    action: "content_created",
    entity_type: "seo_page",
    entity_id: created.id.toString(),
    after_data: {
      slug: rawSlug,
      title: insertData.title,
      page_type: insertData.pageType,
    },
  });

  event.node.res.statusCode = 201;
  return created;
});
