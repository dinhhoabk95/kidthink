import { NotFoundError } from "@mindkid/errors/common";
import { LEGAL_DOCUMENTS } from "@mindkid/shared";
import { defineEventHandler, getRouterParam, setHeader } from "h3";

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw new NotFoundError();
  }

  const doc = LEGAL_DOCUMENTS.find((d) => d.slug === slug);
  if (!doc) {
    throw new NotFoundError("Không tìm thấy văn bản pháp lý.");
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
