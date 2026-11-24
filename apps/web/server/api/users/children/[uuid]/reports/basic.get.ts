import { EntitlementRequiredError } from "@mindkid/errors/billing";
import { ValidationError } from "@mindkid/errors/common";
import type { BasicReportPeriod } from "@mindkid/shared";
import { getQuery, getRouterParam } from "h3";
import { z } from "zod";
import { getChildBasicReportForUser } from "#server/services/child-report-service";
import { defineApiRoute } from "#server/utils/define-api-route";

const BasicReportQuerySchema = z.object({
  period: z.enum(["7d", "30d"]).default("7d"),
});

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

    return await getChildBasicReportForUser({
      userId: Number(user.user_id),
      childUuid,
      period: validatedPeriod,
    });
  },
});
