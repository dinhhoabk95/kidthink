import { writeAudit } from "@mindkid/audit";
import { getOwnerDb, seoPages } from "@mindkid/db";
import { InternalError, ValidationError } from "@mindkid/errors/common";
import { CodeAlreadyExistsError } from "@mindkid/errors/content";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const FORBIDDEN_LEGAL_SLUGS = [
  "terms",
  "privacy",
  "child-privacy",
  "/terms",
  "/privacy",
  "/child-privacy",
];

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

const createSeoPageSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  meta_description: z.string().min(1),
  page_type: z
    .enum(["competency", "skill", "age_program", "topic", "static", "faq"])
    .optional()
    .default("topic"),
  h1: z.string().optional(),
  body: z.string().optional(),
  og_image_path: z.string().nullable().optional(),
  canonical_url: z.string().nullable().optional(),
  noindex: z.boolean().optional(),
  related_content_refs: z
    .array(z.object({ type: z.string(), code: z.string() }))
    .optional(),
  faq_items: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
});

type CreateSeoPageInput =
  | z.input<typeof createSeoPageSchema>
  | Record<string, never>;

function validateAndBuildSeoInsert(
  rawBody: CreateSeoPageInput,
  managerId: number
): typeof seoPages.$inferInsert {
  const parsedResult = createSeoPageSchema.safeParse(rawBody);
  if (!parsedResult.success) {
    throw new ValidationError("Slug, title và meta_description là bắt buộc");
  }

  const body = parsedResult.data;
  let rawSlug = body.slug.trim().toLowerCase();
  if (rawSlug.startsWith("/")) {
    rawSlug = rawSlug.slice(1);
  }

  if (!rawSlug) {
    throw new ValidationError("Slug là bắt buộc");
  }

  // BR-SEO-09: Legal documents forbidden in SEO pages
  if (
    FORBIDDEN_LEGAL_SLUGS.includes(rawSlug) ||
    FORBIDDEN_LEGAL_SLUGS.includes(`/${rawSlug}`)
  ) {
    throw new ValidationError(
      "Các trang pháp lý (terms, privacy, child-privacy) được quản lý qua code PR, không được tạo qua SEO Studio (BR-SEO-09)"
    );
  }

  const title = body.title.trim();
  const metaDescription = body.meta_description.trim();
  const pageType = body.page_type;
  const h1 = body.h1 ? body.h1.trim() : title;
  const bodyHtml = sanitizeRichText(body.body);
  const ogImagePath = body.og_image_path ? String(body.og_image_path) : null;
  const canonicalUrl = body.canonical_url ? String(body.canonical_url) : null;
  const noindex = Boolean(body.noindex);
  const relatedContentRefs = body.related_content_refs || [];
  const faqItems = body.faq_items || [];

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
  const body = event.context?.body ?? (await readBody(event).catch(() => ({})));

  const managerId = manager.manager_id;
  const insertData = validateAndBuildSeoInsert(body, managerId);
  const rawSlug = insertData.slug;
  const db = getOwnerDb();

  // Check slug collision
  const [existing] = await db
    .select({ id: seoPages.id })
    .from(seoPages)
    .where(and(eq(seoPages.slug, rawSlug), eq(seoPages.contentVersion, 1)));

  if (existing) {
    throw new CodeAlreadyExistsError(
      `SEO page với slug '${rawSlug}' đã tồn tại`
    );
  }

  const [created] = await db.insert(seoPages).values(insertData).returning();

  if (!created) {
    throw new InternalError("Tạo trang SEO thất bại");
  }

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
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
  });

  setResponseStatus(event, 201);
  return created;
});
