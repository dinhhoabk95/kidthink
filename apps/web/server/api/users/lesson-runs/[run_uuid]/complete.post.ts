import { requireUserAuth } from "@mindkid/auth";
import { createError, defineEventHandler, getRouterParam } from "h3";
import { LessonSessionRunnerService } from "#server/services/index.js";

export default defineEventHandler(async (event) => {
  const auth = requireUserAuth(event);
  const runUuid = getRouterParam(event, "run_uuid");

  if (!runUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "VALIDATION_FAILED",
      data: { code: "VALIDATION_FAILED", message: "Thiếu run_uuid." },
    });
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
      throw createError({
        statusCode: 404,
        statusMessage: "NOT_FOUND",
        data: { code: "NOT_FOUND", message: "Không tìm thấy lượt chạy." },
      });
    }
    if (errorName === "SESSION_ALREADY_COMPLETED") {
      throw createError({
        statusCode: 409,
        statusMessage: "SESSION_ALREADY_COMPLETED",
        data: {
          code: "SESSION_ALREADY_COMPLETED",
          message: "Lượt chạy tiết học đã kết thúc.",
        },
      });
    }
    throw err;
  }
});
