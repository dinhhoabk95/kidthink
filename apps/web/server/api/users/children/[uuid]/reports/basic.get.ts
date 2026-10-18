import { childProfiles, entitlements, getOwnerDb } from "@mindkid/db";
import { EntitlementRequiredError } from "@mindkid/errors/billing";
import { ChildNotFoundError } from "@mindkid/errors/child";
import { ValidationError } from "@mindkid/errors/common";
import type { BasicReportPeriod } from "@mindkid/shared";
import { and, eq, inArray } from "drizzle-orm";
import { getQuery, getRouterParam } from "h3";
import { z } from "zod";
import { buildBasicReport } from "#server/services/index.js";
import { defineApiRoute } from "#server/utils/define-api-route";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

const BasicReportQuerySchema = z.object({
  period: z.enum(["7d", "30d"]).default("7d"),
});

/**
 * BR-BRP-01..08 & spec §3, §7, §8
 * Basic Child Report API:
 * - Requires requireUserAuth() + DB child ownership (returns 404 for another user's child).
 * - Every logged-in user has view_basic_report by default unless explicitly revoked/cancelled (403 ENTITLEMENT_REQUIRED).
 * - Validates period query parameter strictly: 7d | 30d (defaults to 7d, rejects others with 422).
 * - Reads strictly from rollup tables (child_daily_stats & child_session_summaries).
 */
export default defineApiRoute({
  auth: "user",
  handler: async ({ event, auth: user }) => {
    const contextParams = (
      event.context as { params?: Record<string, string | undefined> }
    )?.params;
    const childUuid = getRouterParam(event, "uuid") ?? contextParams?.uuid;

    if (!childUuid) {
      throw new ValidationError("Mã định danh trẻ là bắt buộc.");
    }

    // 1. Validate period query parameter (7d | 30d)
    const query = getQuery(event);
    const contextQuery = Reflect.get(event.context, "query");
    let rawPeriod: string | undefined;
    if (typeof query?.period === "string") {
      rawPeriod = query.period;
    } else if (
      typeof contextQuery === "object" &&
      contextQuery !== null &&
      typeof Reflect.get(contextQuery, "period") === "string"
    ) {
      rawPeriod = String(Reflect.get(contextQuery, "period"));
    }

    const parsedQuery = BasicReportQuerySchema.safeParse({
      period: rawPeriod,
    });
    if (!parsedQuery.success) {
      throw new ValidationError(
        "Khoảng thời gian không hợp lệ. Báo cáo cơ bản chỉ chấp nhận '7d' hoặc '30d'."
      );
    }
    const validatedPeriod: BasicReportPeriod = parsedQuery.data.period;

    // 2. Check explicit context entitlements if provided
    const explicitContextEntitlements = (
      user as { entitlements?: readonly string[] }
    ).entitlements;
    if (
      Array.isArray(explicitContextEntitlements) &&
      !explicitContextEntitlements.includes("view_basic_report")
    ) {
      throw new EntitlementRequiredError(
        "Tài khoản không có quyền xem báo cáo cơ bản."
      );
    }

    const userId = Number(user.user_id);
    const db = getOwnerDb();

    // 3. Verify child ownership in DB (BR-BRP-05: 404 for non-existent or unowned child)
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

    // 4. Check view_basic_report entitlement in DB (granted to all logged-in users unless revoked)
    const activeEntitlements = await resolveUserActiveEntitlements(userId);
    if (!activeEntitlements.includes("view_basic_report")) {
      const basicRows = await db
        .select({ status: entitlements.status })
        .from(entitlements)
        .where(
          and(
            eq(entitlements.userId, userId),
            eq(entitlements.entitlementKey, "view_basic_report")
          )
        );

      if (basicRows.length > 0) {
        throw new EntitlementRequiredError(
          "Quyền xem báo cáo cơ bản của tài khoản đã hết hiệu lực."
        );
      }
    }

    const period: BasicReportPeriod = validatedPeriod;
    const childId = Number(child.id);

    // 5. Build 6 sections of the Basic Report from rollup tables
    return await buildBasicReport({
      childId,
      period,
    });
  },
});
