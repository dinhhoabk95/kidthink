import { defineEventHandler } from "h3";
import { listMergedFeatureFlags } from "#server/services/feature-flags";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export type { MergedFeatureFlag } from "#server/services/feature-flags";

export default defineEventHandler(async (event) => {
  // BR-FFA-03: super_admin only
  requireSuperAdminSession(event);

  return await listMergedFeatureFlags();
});
