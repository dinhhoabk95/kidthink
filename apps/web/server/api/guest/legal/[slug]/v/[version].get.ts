import { LEGAL_DOCUMENTS } from "@kidthink/shared";
import { createError, defineEventHandler, getRouterParam, setHeader } from "h3";

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, "slug");
  const version = getRouterParam(event, "version");

  if (!(slug && version)) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const doc = LEGAL_DOCUMENTS.find((d) => d.slug === slug);
  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  setHeader(event, "Cache-Control", "public, max-age=86400, immutable");

  // BR-LGL-02: Permanent archive access with HTTP 200
  return {
    slug: doc.slug,
    title: `${doc.title} (Phiên bản ${version})`,
    version,
    effective_date: doc.effectiveDate,
    review_status: doc.reviewStatus,
    summary: doc.summary,
    requires_consent: doc.requiresConsent,
    is_child_specific: doc.isChildSpecific,
    is_archived_version: version !== doc.version,
    current_version_url: `/${doc.slug}`,
    sections: doc.sections,
  };
});
