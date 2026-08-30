import { getOwnerDb, seoPages, writeAudit } from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

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

function handleSlugChange(
  newSlugVal: unknown,
  existing: typeof seoPages.$inferSelect,
  currentSlug: string,
  updates: Partial<typeof seoPages.$inferInsert>
): void {
  if (!newSlugVal || newSlugVal === currentSlug) {
    return;
  }
  const newSlug = String(newSlugVal).trim().toLowerCase();
  if (
    FORBIDDEN_LEGAL_SLUGS.includes(newSlug) ||
    FORBIDDEN_LEGAL_SLUGS.includes(`/${newSlug}`)
  ) {
    throw createError({
      statusCode: 422,
      statusMessage: "FORBIDDEN_LEGAL_SLUG",
      message: "Không được sử dụng slug của trang pháp lý (BR-SEO-09)",
    });
  }
  updates.slug = newSlug;
  if (existing.status === "published") {
    updates.redirectFrom = currentSlug;
  }
}

function applyMetaFields(
  body: Record<string, unknown> | undefined,
  updates: Partial<typeof seoPages.$inferInsert>
): void {
  if (body?.og_image_path !== undefined) {
    updates.ogImagePath = body.og_image_path as string | null;
  }
  if (body?.canonical_url !== undefined) {
    updates.canonicalUrl = body.canonical_url as string | null;
  }
  if (body?.noindex !== undefined) {
    updates.noindex = Boolean(body.noindex);
  }
  if (body?.related_content_refs !== undefined) {
    updates.relatedContentRefs = body.related_content_refs as Array<{
      type: string;
      code: string;
    }>;
  }
  if (body?.faq_items !== undefined) {
    updates.faqItems = body.faq_items as Array<{ q: string; a: string }>;
  }
}

function buildSeoPageUpdates(
  body: Record<string, unknown> | undefined,
  existing: typeof seoPages.$inferSelect,
  slug: string
): Partial<typeof seoPages.$inferInsert> {
  const updates: Partial<typeof seoPages.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (body?.title) {
    updates.title = String(body.title).trim();
  }
  if (body?.meta_description) {
    updates.metaDescription = String(body.meta_description).trim();
  }
  if (body?.h1 !== undefined) {
    updates.h1 = body.h1 ? String(body.h1).trim() : null;
  }
  if (body?.body !== undefined) {
    updates.body = sanitizeRichText(body.body as string | undefined);
  }

  applyMetaFields(body, updates);
  handleSlugChange(body?.new_slug, existing, slug, updates);

  return updates;
}

import { z } from "zod";

const patchSeoPageSchema = z.object({
  title: z.string().optional(),
  meta_description: z.string().optional(),
  h1: z.string().nullable().optional(),
  body: z.string().optional(),
  og_image_path: z.string().nullable().optional(),
  canonical_url: z.string().nullable().optional(),
  noindex: z.boolean().optional(),
  related_content_refs: z
    .array(z.object({ type: z.string(), code: z.string() }))
    .optional(),
  faq_items: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  new_slug: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);
  const slug = getRouterParam(event, "slug");
  const version = Number(getRouterParam(event, "version"));

  if (!(slug && version)) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const db = getOwnerDb();
  const [existing] = await db
    .select()
    .from(seoPages)
    .where(and(eq(seoPages.slug, slug), eq(seoPages.contentVersion, version)));

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "SEO_PAGE_NOT_FOUND",
    });
  }

  const raw = event.context?.body ?? (await readBody(event).catch(() => ({})));

  const body = patchSeoPageSchema.parse(raw);

  const updates = buildSeoPageUpdates(body, existing, slug);

  const [updated] = await db
    .update(seoPages)
    .set(updates)
    .where(eq(seoPages.id, existing.id))
    .returning();

  if (!updated) {
    throw createError({
      statusCode: 500,
      statusMessage: "SEO_PAGE_UPDATE_FAILED",
      message: "Cập nhật trang SEO thất bại",
    });
  }

  const managerId = manager.manager_id;
  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: "content_created",
      entity_type: "seo_page",
      entity_id: existing.id.toString(),
      after_data: updates,
    });
  });

  return updated;
});
