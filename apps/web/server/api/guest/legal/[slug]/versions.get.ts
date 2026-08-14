import { LEGAL_DOCUMENTS } from "@kidthink/shared";
import { createError, defineEventHandler, getRouterParam } from "h3";

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const doc = LEGAL_DOCUMENTS.find((d) => d.slug === slug);
  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  return {
    slug: doc.slug,
    title: doc.title,
    current_version: doc.version,
    versions: [
      {
        version: doc.version,
        effective_date: doc.effectiveDate,
        is_current: true,
        url: `/${doc.slug}`,
      },
    ],
  };
});
