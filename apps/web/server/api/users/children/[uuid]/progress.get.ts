import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam } from "h3";
import { getChildMasteryProgressReport } from "#server/services/child-report-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const childUuid = getRouterParam(event, "uuid");
  if (!childUuid) {
    throw new ValidationError("Mã định danh trẻ là bắt buộc.");
  }

  return await getChildMasteryProgressReport({
    userId: Number(user.user_id),
    childUuid,
  });
});
