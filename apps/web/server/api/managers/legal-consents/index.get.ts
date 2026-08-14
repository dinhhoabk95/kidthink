import { AppError } from "@kidthink/auth";
import { consentRequirements, getOwnerDb } from "@kidthink/db";
import { CONSENT_POLICY_MAP, type ConsentType } from "@kidthink/shared";
import { createError, defineEventHandler, setResponseStatus } from "h3";
import {
  requireSuperAdminSession,
  respondToManagerAuthError,
} from "../../../utils/admin-auth-runtime.js";

const CONSENT_TYPES: readonly ConsentType[] = [
  "terms",
  "privacy",
  "child_data",
];

export default defineEventHandler(async (event) => {
  try {
    requireSuperAdminSession(event);

    const db = getOwnerDb();
    const reqs = await db.select().from(consentRequirements);

    const requirements = CONSENT_TYPES.map((type) => {
      const meta = CONSENT_POLICY_MAP[type];
      const req = reqs.find((r) => r.consentType === type);

      return {
        consent_type: type,
        title_vi: meta.titleVi,
        document_url: `/${meta.slug}`,
        reconsent_required_at: req?.reconsentRequiredAt
          ? req.reconsentRequiredAt.toISOString()
          : null,
        notice_vi: req?.noticeVi ?? null,
        updated_at: req?.updatedAt ? req.updatedAt.toISOString() : null,
      };
    });

    return {
      requirements,
    };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: err.toResponse(),
      });
    }
    return respondToManagerAuthError(event, err);
  }
});
