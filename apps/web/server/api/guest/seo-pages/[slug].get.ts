import { gameLevels, getOwnerDb, seoPages } from "@mindkid/db";
import { SeoPageNotFoundError } from "@mindkid/errors/content";
import { and, desc, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam, sendRedirect } from "h3";
import { z } from "zod";

const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const IFRAME_TAG_REGEX = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
const SVG_TAG_REGEX = /<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi;
const STYLE_TAG_REGEX = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;
const DANGEROUS_TAG_REGEX =
  /<\/?(?:script|iframe|svg|object|embed|base|meta|link|style|form)\b[^>]*>/gi;
const INLINE_EVENT_HANDLER_REGEX =
  /\bon[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const DANGEROUS_PROTOCOL_REGEX =
  /(?:j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t|v\s*b\s*s\s*c\s*r\s*i\s*p\s*t)\s*:[^\s"'>]*/gi;
const DATA_URI_ATTR_REGEX =
  /\b(href|src|xlink:href)\s*=\s*(?:"\s*data:[^"]*"|'\s*data:[^']*'|data:[^\s>]+)/gi;

const FaqItemsSchema = z.array(
  z.object({
    q: z.string(),
    a: z.string(),
  })
);

const RelatedContentRefsSchema = z.array(
  z.object({
    type: z.string(),
    code: z.string(),
  })
);

interface CourseSchema {
  "@context": "https://schema.org";
  "@type": "Course";
  description: string | null;
  name: string;
  provider: {
    "@type": "Organization";
    name: string;
    url: string;
  };
}

interface ArticleSchema {
  "@context": "https://schema.org";
  "@type": "Article";
  author: {
    "@type": "Organization";
    name: string;
  };
  description: string | null;
  headline: string;
}

interface FaqPageSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
    name: string;
  }>;
}

type StructuredDataSchema = CourseSchema | ArticleSchema | FaqPageSchema;

function sanitizeHtmlForRender(html: string | null | undefined): string {
  if (!html) {
    return "";
  }
  // Strip any script, iframe, svg, dangerous tags, inline event handlers, or dangerous URI protocols
  return html
    .replace(SCRIPT_TAG_REGEX, "")
    .replace(IFRAME_TAG_REGEX, "")
    .replace(SVG_TAG_REGEX, "")
    .replace(STYLE_TAG_REGEX, "")
    .replace(DANGEROUS_TAG_REGEX, "")
    .replace(INLINE_EVENT_HANDLER_REGEX, "")
    .replace(DATA_URI_ATTR_REGEX, "")
    .replace(DANGEROUS_PROTOCOL_REGEX, "");
}

function buildStructuredData(
  page: typeof seoPages.$inferSelect
): StructuredDataSchema[] {
  const schemas: StructuredDataSchema[] = [];

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

  const parsedFaqs = FaqItemsSchema.safeParse(page.faqItems);
  const faqs = parsedFaqs.success ? parsedFaqs.data : [];
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

async function resolveRelatedGameLevels(
  db: ReturnType<typeof getOwnerDb>,
  rawRefsInput: (typeof seoPages.$inferSelect)["relatedContentRefs"]
) {
  const parsedRefs = RelatedContentRefsSchema.safeParse(rawRefsInput);
  const rawRefs = parsedRefs.success ? parsedRefs.data : [];
  const resolvedRefs: {
    type: string;
    code: string;
    title: string;
    thumbnail?: string | null;
  }[] = [];

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
          and(eq(gameLevels.code, ref.code), eq(gameLevels.status, "published"))
        )
        .orderBy(desc(gameLevels.contentVersion))
        .limit(1);

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
  return resolvedRefs;
}

export default defineEventHandler(async (event) => {
  const slugParam = getRouterParam(event, "slug");
  if (!slugParam) {
    throw new SeoPageNotFoundError();
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
    const resolvedRefs = await resolveRelatedGameLevels(
      db,
      directPage.relatedContentRefs
    );

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

  throw new SeoPageNotFoundError(slug);
});
