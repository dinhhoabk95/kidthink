import { childProfiles, getOwnerDb } from "@mindkid/db";
import { EntitlementRequiredError } from "@mindkid/errors/billing";
import { ChildNotFoundError } from "@mindkid/errors/child";
import { ValidationError } from "@mindkid/errors/common";
import { and, eq, inArray } from "drizzle-orm";
import { defineEventHandler, getQuery, getRouterParam } from "h3";
import { buildAdvancedReport } from "#server/services/index.js";

import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

/**
 * BR-ARP-01..08, D-MY..D-NE & spec §3, §7, §8
 * Advanced Child Report API:
 * - Requires view_advanced_report entitlement (Standard / Premium).
 * - Under missing entitlement -> 403 ENTITLEMENT_REQUIRED + upgrade_package_codes (NO child data leak per D-NB).
 * - Validates period query parameter strictly: 30d | 90d (rejects others with 422).
 * - Surfaces 7 comprehensive sections with minimum data thresholds and non-diagnostic Vietnamese labels.
 */
export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const childUuid = getRouterParam(event, "uuid");

  if (!childUuid) {
    throw new ValidationError("Mã định danh trẻ là bắt buộc.");
  }

  const userId = Number(user.user_id);
  const db = getOwnerDb();

  // 1. Verify child ownership (returns 404 for unowned / non-existent child)
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.uuid, childUuid),
        eq(childProfiles.userId, userId),
        inArray(childProfiles.status, ["active", "archived"])
      )
    );

  if (!child) {
    throw new ChildNotFoundError("Không tìm thấy hồ sơ trẻ.");
  }

  // 2. Gate report access via view_advanced_report entitlement (D-NB)
  const userEntitlements = await resolveUserActiveEntitlements(userId);
  const hasReportAccess = userEntitlements.includes("view_advanced_report");

  if (!hasReportAccess) {
    throw new EntitlementRequiredError(
      "Tài khoản cần có gói Standard hoặc Premium để xem báo cáo nâng cao."
    );
  }

  // 3. Validate period query parameter (30d | 90d)
  const query = getQuery(event);
  const contextQuery = (event.context as { query?: Record<string, unknown> })
    ?.query;
  let rawPeriod = "30d";
  if (typeof query?.period === "string") {
    rawPeriod = query.period;
  } else if (typeof contextQuery?.period === "string") {
    rawPeriod = contextQuery.period;
  }

  if (rawPeriod !== "30d" && rawPeriod !== "90d") {
    throw new ValidationError(
      "Khoảng thời gian không hợp lệ. Báo cáo nâng cao chỉ chấp nhận '30d' hoặc '90d'."
    );
  }

  const period = rawPeriod as "30d" | "90d";
  const childId = Number(child.id);

  // 4. Build 7 sections of the Advanced Report
  const reportData = await buildAdvancedReport({
    childId,
    period,
  });

  return reportData;
});
