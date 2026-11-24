import { EntitlementRequiredError } from "@mindkid/errors/billing";
import { ValidationError } from "@mindkid/errors/common";

import { defineEventHandler, getRouterParam } from "h3";
import { z } from "zod";
import { generateOfflineCurriculumPackManifest } from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import { readRequestQuery } from "#server/utils/request-body";

const OfflinePackQuerySchema = z.object({
  week: z.coerce.number().int().min(1).max(42),
});

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const uuid = getRouterParam(event, "uuid") || "";
  const query = readRequestQuery(event);
  const parsedQuery = OfflinePackQuerySchema.safeParse(query);

  if (!parsedQuery.success) {
    throw new ValidationError(
      "Số thứ tự tuần học không hợp lệ (phải từ 1 đến 42);."
    );
  }
  const weekNo = parsedQuery.data.week;

  // Check entitlement: Standard or Premium package is required for offline packs (BR-OCP-02, BR-OCP-03)
  const entitlements = await resolveUserActiveEntitlements(userId);
  const hasOfflineAccess =
    entitlements.includes("play_standard_games") ||
    entitlements.includes("play_premium_games") ||
    entitlements.includes("access_premium_curriculum");

  if (!hasOfflineAccess) {
    throw new EntitlementRequiredError({
      required_package: "PKG-standard",
      message:
        "Tính năng tải gói học tập ngoại tuyến thuộc gói Tiêu chuẩn hoặc Premium.",
    });
  }

  const manifest = await generateOfflineCurriculumPackManifest(
    { userId, entitlements },
    uuid,
    weekNo
  );

  return manifest;
});
