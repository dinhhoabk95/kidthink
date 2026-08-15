import { getOwnerDb, seoPages } from "@kidthink/db";
import { desc, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.js";

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
        name: "KidThink",
        url: "https://kidthink.edu.vn",
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
        name: "KidThink Sư Phạm",
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
  try {
    await requireManagerSession(event);
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
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
