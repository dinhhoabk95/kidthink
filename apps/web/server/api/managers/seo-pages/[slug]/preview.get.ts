import { getOwnerDb, seoPages } from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { SeoPageNotFoundError } from "@mindkid/errors/content";
import { desc, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { issuePreviewToken } from "#server/utils/preview-token";

interface StructuredDataEntry {
  "@context": string;
  "@type": "Course" | "Article" | "FAQPage";
  name?: string;
  headline?: string;
  description?: string;
  provider?: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  author?: {
    "@type": "Organization";
    name: string;
  };
  mainEntity?: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

function extractFaqPairs(
  rawFaqItems: (typeof seoPages.$inferSelect)["faqItems"]
): Array<{ q: string; a: string }> {
  if (!Array.isArray(rawFaqItems)) {
    return [];
  }
  const pairs: Array<{ q: string; a: string }> = [];
  for (const item of rawFaqItems) {
    if (typeof item === "object" && item !== null) {
      const qVal = Reflect.get(item, "q") ?? Reflect.get(item, "question");
      const aVal = Reflect.get(item, "a") ?? Reflect.get(item, "answer");
      if (typeof qVal === "string" && typeof aVal === "string") {
        pairs.push({ q: qVal, a: aVal });
      }
    }
  }
  return pairs;
}

function buildStructuredData(
  page: typeof seoPages.$inferSelect
): StructuredDataEntry[] {
  const schemas: StructuredDataEntry[] = [];

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
  const faqs = extractFaqPairs(page.faqItems);
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
    throw new NotFoundError("NOT_FOUND");
  }

  const db = getOwnerDb();
  const [page] = await db
    .select()
    .from(seoPages)
    .where(eq(seoPages.slug, slug))
    .orderBy(desc(seoPages.contentVersion))
    .limit(1);

  if (!page) {
    throw new SeoPageNotFoundError("SEO_PAGE_NOT_FOUND");
  }

  const structuredData = buildStructuredData(page);
  const managerId = manager.manager_id;

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
