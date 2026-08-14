import { LEGAL_DOCUMENTS } from "@kidthink/shared";
import { createError, defineEventHandler, getRouterParam, setHeader } from "h3";

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const doc = LEGAL_DOCUMENTS.find((d) => d.slug === slug);
  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  setHeader(event, "Cache-Control", "public, max-age=3600");

  return {
    slug: doc.slug,
    title: doc.title,
    last_updated_on: doc.effectiveDate,
    review_status: doc.reviewStatus,
    summary: doc.summary,
    requires_consent: doc.requiresConsent,
    is_child_specific: doc.isChildSpecific,
    sections: doc.sections,
  };
});
