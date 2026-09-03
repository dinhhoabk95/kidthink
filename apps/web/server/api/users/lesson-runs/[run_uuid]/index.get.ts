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
    const result = await LessonSessionRunnerService.getLessonRun(
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
    throw err;
  }
});
