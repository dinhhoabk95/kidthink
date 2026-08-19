import { requireUserAuth } from "@mindkid/auth";
import { LessonSessionRunnerService } from "@mindkid/db";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";

const UpdateStepSchema = z.object({
  step_index: z.number().int().min(0),
  outcome: z.enum(["done", "skipped"]),
});

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

  const rawBody = await readBody(event);
  const parsed = UpdateStepSchema.safeParse(rawBody);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "VALIDATION_FAILED",
      data: { code: "VALIDATION_FAILED", issues: parsed.error.issues },
    });
  }

  try {
    const result = await LessonSessionRunnerService.updateStep(
      runUuid,
      auth.user_id,
      parsed.data.step_index,
      parsed.data.outcome
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
    if (errorName === "VALIDATION_FAILED") {
      throw createError({
        statusCode: 422,
        statusMessage: "VALIDATION_FAILED",
        data: {
          code: "VALIDATION_FAILED",
          message: "Bước không hợp lệ trong tiết học này.",
        },
      });
    }
    throw err;
  }
});
