import { requireUserAuth } from "@mindkid/auth";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { SessionAlreadyCompletedError } from "@mindkid/errors/play";
import { defineEventHandler, getRouterParam } from "h3";
import { LessonSessionRunnerService } from "#server/services/index.js";

export default defineEventHandler(async (event) => {
  const auth = requireUserAuth(event);
  const runUuid = getRouterParam(event, "run_uuid");

  if (!runUuid) {
    throw new ValidationError("Thiếu run_uuid.");
  }

  try {
    const result = await LessonSessionRunnerService.completeLessonRun(
      runUuid,
      auth.user_id
    );

    return result;
  } catch (err: unknown) {
    const errorName = err instanceof Error ? err.name : "";
    if (errorName === "NOT_FOUND") {
      throw new NotFoundError("Không tìm thấy lượt chạy.");
    }
    if (errorName === "SESSION_ALREADY_COMPLETED") {
      throw new SessionAlreadyCompletedError("Lượt chạy tiết học đã kết thúc.");
    }
    throw err;
  }
});
