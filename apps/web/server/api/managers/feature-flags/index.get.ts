import { InsufficientRoleError } from "@mindkid/errors/auth";
import { defineEventHandler } from "h3";
import { listMergedFeatureFlags } from "#server/services/feature-flags";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export type { MergedFeatureFlag } from "#server/services/feature-flags";

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền xem và quản lý cờ tính năng (BR-FFA-03)"
    );
  }

  return await listMergedFeatureFlags();
});
