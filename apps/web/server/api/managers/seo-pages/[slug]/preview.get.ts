import { getOwnerDb, seoPages } from "@mindkid/db";
import { desc, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "../../../../utils/admin-auth-runtime.js";
import { issuePreviewToken } from "../../../../utils/preview-token.js";

function buildStructuredData(page: typeof seoPages.$inferSelect) {
  const schemas: Record<string, unknown>[] = [];

  // Base Schema
  if (
    page.pageType === "competency" ||
    page.pageType === "skill" ||
    page.pageType === "age_program"
  ) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Course",
      name: page.title,
      description: page.metaDescription,
      provider: {
        "@type": "Organization",
        name: "MindKid",
        url: "https://mindkid.edu.vn",
      },
    });
  } else {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: page.title,
      description: page.metaDescription,
      author: {
        "@type": "Organization",
        name: "MindKid Sư Phạm",
      },
    });
  }

  // FAQ Schema (BR-SEO-06)
  const faqs = (page.faqItems as Array<{ q: string; a: string }>) || [];
  if (faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a,
        },
      })),
    });
  }

  return schemas;
}

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);
  const slug = getRouterParam(event, "slug");

  if (!slug) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const db = getOwnerDb();
  const [page] = await db
    .select()
    .from(seoPages)
    .where(eq(seoPages.slug, slug))
    .orderBy(desc(seoPages.contentVersion))
    .limit(1);

  if (!page) {
    throw createError({
      statusCode: 404,
      statusMessage: "SEO_PAGE_NOT_FOUND",
    });
  }

  const structuredData = buildStructuredData(page);
  const managerId = manager.manager_id || manager.id || 1;

  const previewToken = issuePreviewToken({
    entityType: "seo_page",
    id: page.id,
    version: page.contentVersion,
    managerId,
  });

  // Snippet preview truncation (BR-SEO-05, §7.3)
  const snippetTitle =
    page.title.length > 60 ? `${page.title.slice(0, 57)}...` : page.title;
  const snippetDescription =
    page.metaDescription.length > 160
      ? `${page.metaDescription.slice(0, 157)}...`
      : page.metaDescription;

  return {
    slug: page.slug,
    title: page.title,
    meta_description: page.metaDescription,
    h1: page.h1 || page.title,
    body: page.body,
    og_image_path: page.ogImagePath,
    canonical_url: page.canonicalUrl,
    noindex: page.noindex,
    structured_data: structuredData,
    preview_token: previewToken,
    snippet_preview: {
      title: snippetTitle,
      description: snippetDescription,
      url: `https://mindkid.edu.vn/seo/${page.slug}`,
    },
  };
});
