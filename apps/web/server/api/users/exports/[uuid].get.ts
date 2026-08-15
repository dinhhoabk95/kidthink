import { appError } from "@kidthink/auth";
import { getExportJobByUuid } from "@kidthink/db";
import { defineEventHandler, getRouterParam } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      throw appError("NOT_FOUND", "Thiếu mã định danh tiến trình xuất file.");
    }

    const userId = Number(user.user_id);
    const job = await getExportJobByUuid(userId, uuid);

    return job;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
