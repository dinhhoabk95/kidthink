import { appError } from "@mindkid/auth";
import { generateOfflineCurriculumPackManifest } from "@mindkid/db";
import { defineEventHandler, getQuery, getRouterParam } from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const uuid = getRouterParam(event, "uuid") || "";
  const eventQuery =
    (event.context as { query?: Record<string, unknown> })?.query ||
    (event as { _query?: Record<string, unknown> })._query;
  const query = eventQuery || getQuery(event) || {};
  const weekNo = Number(query.week);

  if (!weekNo || Number.isNaN(weekNo) || weekNo < 1 || weekNo > 42) {
    throw appError(
      "VALIDATION_FAILED",
      "Số thứ tự tuần học không hợp lệ (phải từ 1 đến 42)."
    );
  }

  // Check entitlement: Standard or Premium package is required for offline packs (BR-OCP-02, BR-OCP-03)
  const entitlements = await resolveUserActiveEntitlements(userId);
  const hasOfflineAccess =
    entitlements.includes("play_standard_games") ||
    entitlements.includes("play_premium_games") ||
    entitlements.includes("access_premium_curriculum");

  if (!hasOfflineAccess) {
    throw appError("ENTITLEMENT_REQUIRED", {
      required_package: "PKG-standard",
      message:
        "Tính năng tải gói học tập ngoại tuyến thuộc gói Tiêu chuẩn hoặc Premium.",
    });
  }

  const manifest = await generateOfflineCurriculumPackManifest(
    { userId },
    uuid,
    weekNo
  );

  return manifest;
});
