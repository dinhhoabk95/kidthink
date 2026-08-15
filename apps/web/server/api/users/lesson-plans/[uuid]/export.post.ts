import { appError } from "@kidthink/auth";
import { requestExportJob } from "@kidthink/db";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";
import { resolveUserActiveEntitlements } from "../../../../utils/entitlements-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      throw appError("NOT_FOUND", "Thiếu mã định danh giáo án.");
    }

    const userId = Number(user.user_id);
    const entitlements = await resolveUserActiveEntitlements(userId);
    const result = await requestExportJob(userId, "lesson_plan", uuid, {
      userEntitlements: entitlements,
    });

    setResponseStatus(event, 202);
    return {
      plan_uuid: uuid,
      export_token: result.job_uuid,
      job_uuid: result.job_uuid,
      status: result.status,
    };
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
