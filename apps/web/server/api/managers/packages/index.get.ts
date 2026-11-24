import { defineEventHandler } from "h3";
import { listManagerPackagesWithMetrics } from "#server/services/packages-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  requireSuperAdminSession(event);
  return await listManagerPackagesWithMetrics();
});
