import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getQuery, getRouterParam } from "h3";
import { z } from "zod";
import { getChildAdvancedReportForUser } from "#server/services/child-report-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

const AdvancedReportQuerySchema = z.object({
  period: z.enum(["30d", "90d"]).default("30d"),
});

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const childUuid = getRouterParam(event, "uuid");
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

  const parsedQuery = AdvancedReportQuerySchema.safeParse({
    period: rawPeriod,
  });
  if (!parsedQuery.success) {
    throw new ValidationError(
      "Khoảng thời gian không hợp lệ. Báo cáo nâng cao chỉ chấp nhận '30d' hoặc '90d'."
    );
  }

  return await getChildAdvancedReportForUser({
    userId: Number(user.user_id),
    childUuid,
    period: parsedQuery.data.period,
  });
});
