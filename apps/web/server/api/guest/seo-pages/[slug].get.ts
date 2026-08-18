import { gameLevels, getOwnerDb, seoPages } from "@mindkid/db";
import { and, desc, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  sendRedirect,
} from "h3";

function sanitizeHtmlForRender(html: string | null | undefined): string {
  if (!html) {
    return "";
  }
  // Strip any script, iframe, or dangerous inline event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:[^"']*/gi, "");
}

function buildStructuredData(page: typeof seoPages.$inferSelect) {
  const schemas: Record<string, unknown>[] = [];

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
  const slugParam = getRouterParam(event, "slug");
  if (!slugParam) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const slug = slugParam.toLowerCase().trim();
  const db = getOwnerDb();

  // 1. Direct match on published slug
  const [directPage] = await db
    .select()
    .from(seoPages)
    .where(and(eq(seoPages.slug, slug), eq(seoPages.status, "published")))
    .orderBy(desc(seoPages.contentVersion))
    .limit(1);

  if (directPage) {
    // Resolve embedded content references dynamically (BR-SEO-03)
    const rawRefs =
      (directPage.relatedContentRefs as Array<{
        type: string;
        code: string;
      }>) || [];
    const resolvedRefs: Array<{
      type: string;
      code: string;
      title: string;
      thumbnail?: string | null;
    }> = [];

    for (const ref of rawRefs) {
      if (ref.type === "game_level" && ref.code) {
        const [pubLevel] = await db
          .select({
            title: gameLevels.title,
            thumbnailEmoji: gameLevels.thumbnailEmoji,
            status: gameLevels.status,
          })
          .from(gameLevels)
          .where(
            and(
              eq(gameLevels.code, ref.code),
              eq(gameLevels.status, "published")
            )
          )
          .orderBy(desc(gameLevels.contentVersion))
          .limit(1);

        // Only include if published (if archived, hide dynamically)
        if (pubLevel) {
          resolvedRefs.push({
            type: "game_level",
            code: ref.code,
            title: pubLevel.title,
            thumbnail: pubLevel.thumbnailEmoji,
          });
        }
      }
    }

    return {
      slug: directPage.slug,
      page_type: directPage.pageType,
      title: directPage.title,
      meta_description: directPage.metaDescription,
      h1: directPage.h1 || directPage.title,
      body: sanitizeHtmlForRender(directPage.body),
      og_image_path: directPage.ogImagePath,
      canonical_url: directPage.canonicalUrl,
      noindex: directPage.noindex,
      access_tier: "free",
      structured_data: buildStructuredData(directPage),
      related_content: resolvedRefs,
    };
  }

  // 2. Check 301 Redirect for old slug (BR-SEO-01)
  const [redirectPage] = await db
    .select()
    .from(seoPages)
    .where(
      and(eq(seoPages.redirectFrom, slug), eq(seoPages.status, "published"))
    )
    .orderBy(desc(seoPages.contentVersion))
    .limit(1);

  if (redirectPage) {
    return sendRedirect(event, `/seo/${redirectPage.slug}`, 301);
  }

  throw createError({
    statusCode: 404,
    statusMessage: "PAGE_NOT_FOUND",
    message: `Trang SEO '${slug}' không tồn tại hoặc chưa xuất bản`,
  });
});
