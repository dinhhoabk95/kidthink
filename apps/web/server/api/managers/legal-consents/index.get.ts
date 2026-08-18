import { consentRequirements, getOwnerDb } from "@mindkid/db";
import { CONSENT_POLICY_MAP, type ConsentType } from "@mindkid/shared";
import { defineEventHandler } from "h3";
import { requireSuperAdminSession } from "../../../utils/admin-auth-runtime.js";

const CONSENT_TYPES: readonly ConsentType[] = [
  "terms",
  "privacy",
  "child_data",
];

export default defineEventHandler(async (event) => {
  requireSuperAdminSession(event);

  const db = getOwnerDb();
  const reqs = await db.select().from(consentRequirements);

  const requirements = CONSENT_TYPES.map((type) => {
    const meta = CONSENT_POLICY_MAP[type];
    const req = reqs.find((r) => r.consentType === type);

    return {
      consent_type: type,
      title: meta.title,
      document_url: `/${meta.slug}`,
      reconsent_required_at: req?.reconsentRequiredAt
        ? req.reconsentRequiredAt.toISOString()
        : null,
      notice: req?.notice ?? null,
      updated_at: req?.updatedAt ? req.updatedAt.toISOString() : null,
    };
  });

  return {
    requirements,
  };
});
