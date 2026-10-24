import { writeAudit } from "@mindkid/audit";
import { getOwnerDb, seoPages } from "@mindkid/db";
import {
  InternalError,
  NotFoundError,
  ValidationError,
} from "@mindkid/errors/common";
import { SeoPageNotFoundError } from "@mindkid/errors/content";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";

const FORBIDDEN_LEGAL_SLUGS = [
  "terms",
  "privacy",
  "child-privacy",
  "/terms",
  "/privacy",
  "/child-privacy",
];

const patchSeoPageSchema = z.object({
  page_type: z
    .enum(["competency", "skill", "age_program", "topic", "static", "faq"])
    .optional(),
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

type PatchSeoPageInput = z.infer<typeof patchSeoPageSchema>;

const DANGEROUS_SEO_TAG_REGEX =
  /<\s*\/?\s*(?:script|iframe|svg|object|embed|base|meta|link|style|form)\b/i;
const INLINE_EVENT_ATTR_REGEX = /\bon[a-z]+\s*=/i;
const DATA_URI_ATTR_REGEX = /\b(?:href|src|xlink:href)\s*=\s*["']?\s*data:/i;

function decodeHtmlEntitiesForInspect(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16) || 0)
    )
    .replace(/&#([0-9]+);?/g, (_, dec: string) =>
      String.fromCodePoint(Number.parseInt(dec, 10) || 0)
    )
    .replace(/&colon;/gi, ":")
    .replace(/&tab;/gi, "\t")
    .replace(/&newline;/gi, "\n");
}

function sanitizeRichText(html: string | undefined): string | undefined {
  if (!html) {
    return html;
  }
  const decoded = decodeHtmlEntitiesForInspect(html);
  const lower = decoded.toLowerCase();
  const collapsed = Array.from(lower)
    .filter((ch) => ch.charCodeAt(0) > 32)
    .join("");
  if (
    DANGEROUS_SEO_TAG_REGEX.test(lower) ||
    INLINE_EVENT_ATTR_REGEX.test(lower) ||
    DATA_URI_ATTR_REGEX.test(lower) ||
    collapsed.includes("javascript:") ||
    collapsed.includes("vbscript:")
  ) {
    throw new ValidationError(
      "Nội dung chứa mã script hoặc HTML không được phép (BR-SEO-02)"
    );
  }
  return html;
}

function handleSlugChange(
  newSlugVal: string | undefined,
  existing: typeof seoPages.$inferSelect,
  currentSlug: string,
  updates: Partial<typeof seoPages.$inferInsert>
): void {
  if (!newSlugVal || newSlugVal === currentSlug) {
    return;
  }
  const newSlug = newSlugVal.trim().toLowerCase();
  if (
    FORBIDDEN_LEGAL_SLUGS.includes(newSlug) ||
    FORBIDDEN_LEGAL_SLUGS.includes(`/${newSlug}`)
  ) {
    throw new ValidationError(
      "Không được sử dụng slug của trang pháp lý (BR-SEO-09)"
    );
  }
  updates.slug = newSlug;
  if (existing.status === "published") {
    updates.redirectFrom = currentSlug;
  }
}

function applyMetaFields(
  body: PatchSeoPageInput,
  updates: Partial<typeof seoPages.$inferInsert>
): void {
  if (body.og_image_path !== undefined) {
    updates.ogImagePath = body.og_image_path;
  }
  if (body.canonical_url !== undefined) {
    updates.canonicalUrl = body.canonical_url;
  }
  if (body.noindex !== undefined) {
    updates.noindex = Boolean(body.noindex);
  }
  if (body.related_content_refs !== undefined) {
    updates.relatedContentRefs = body.related_content_refs;
  }
  if (body.faq_items !== undefined) {
    updates.faqItems = body.faq_items;
  }
}

function buildSeoPageUpdates(
  body: PatchSeoPageInput,
  existing: typeof seoPages.$inferSelect,
  slug: string
): Partial<typeof seoPages.$inferInsert> {
  const updates: Partial<typeof seoPages.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (body.page_type) {
    updates.pageType = body.page_type;
  }
  if (body.title) {
    updates.title = body.title.trim();
  }
  if (body.meta_description) {
    updates.metaDescription = body.meta_description.trim();
  }
  if (body.h1 !== undefined) {
    updates.h1 = body.h1 ? body.h1.trim() : null;
  }
  if (body.body !== undefined) {
    updates.body = sanitizeRichText(body.body);
  }

  applyMetaFields(body, updates);
  handleSlugChange(body.new_slug, existing, slug, updates);

  return updates;
}

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);
  const slug = getRouterParam(event, "slug");
  const version = Number(getRouterParam(event, "version"));

  if (!(slug && version)) {
    throw new NotFoundError("NOT_FOUND");
  }

  const db = getOwnerDb();
  const [existing] = await db
    .select()
    .from(seoPages)
    .where(and(eq(seoPages.slug, slug), eq(seoPages.contentVersion, version)));

  if (!existing) {
    throw new SeoPageNotFoundError("SEO_PAGE_NOT_FOUND");
  }

  const raw = event.context?.body ?? (await readBody(event).catch(() => ({})));

  const parsed = patchSeoPageSchema.safeParse(raw);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }
  const body = parsed.data;

  const updates = buildSeoPageUpdates(body, existing, slug);

  const [updated] = await db
    .update(seoPages)
    .set(updates)
    .where(eq(seoPages.id, existing.id))
    .returning();

  if (!updated) {
    throw new InternalError("Cập nhật trang SEO thất bại");
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
