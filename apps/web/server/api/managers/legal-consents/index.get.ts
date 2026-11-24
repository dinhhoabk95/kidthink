import { defineEventHandler } from "h3";
import { listManagerLegalConsents } from "#server/services/consent-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  requireSuperAdminSession(event);
  return await listManagerLegalConsents();
});
